"""
Server-Side AI Assistant Tool Registry.
Enforces authorization in code: users can only query their own orders and cart items.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.auth.models import User
from app.modules.orders.models import Order
from app.modules.products.models import Product, ProductVariant
from app.modules.search.service import SearchService

# Curated Knowledge Base for Store Policies (RAG)
STORE_POLICIES = {
    "shipping": (
        "NovaMart offers Free Express Shipping on all orders of $100 or more. "
        "Standard delivery takes 2 to 4 business days. Orders placed before 2 PM EST ship the same day. "
        "International shipping is available to over 40 countries with customs clearance handled automatically."
    ),
    "returns": (
        "We offer a 30-day hassle-free return policy. If you are not completely satisfied with your hardware, "
        "you can initiate a return through your account or contact support. Returned items must be in original condition "
        "with all accessories and packaging. Return shipping labels are complimentary with zero restocking fees."
    ),
    "warranty": (
        "All hardware purchased through NovaMart includes a 2-Year Comprehensive Limited Hardware Warranty, "
        "covering internal component defects, power delivery failures, and display panel anomalies. "
        "Accidental damage protection plans can be added within 30 days of purchase."
    ),
    "price_match": (
        "We offer a 14-day low price guarantee. If you spot an identical in-stock hardware configuration from an authorized "
        "retailer at a lower price within 14 days of purchase, we will refund the difference."
    ),
}


class ToolDispatcher:
    def __init__(self, db: AsyncSession, current_user: Optional[User]):
        self.db = db
        self.current_user = current_user
        self.search_service = SearchService(db)

    async def execute_tool(self, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        handler = getattr(self, f"tool_{name}", None)
        if not handler:
            return {"error": f"Unknown tool: '{name}'"}
        try:
            return await handler(args)
        except Exception as e:
            return {"error": f"Error executing {name}: {str(e)}"}

    async def tool_search_products(self, args: Dict[str, Any]) -> Dict[str, Any]:
        query = args.get("query", "")
        res = await self.search_service.search(query=query, mode="hybrid", limit=3)
        return {
            "products": [
                {
                    "id": p.id,
                    "title": p.title,
                    "brand": p.brand,
                    "price": f"${(p.base_price_cents / 100):.2f}",
                    "rating": p.rating_avg,
                    "primary_image_url": p.primary_image_url,
                    "slug": p.slug,
                }
                for p in res.items
            ]
        }

    async def tool_get_product_details(self, args: Dict[str, Any]) -> Dict[str, Any]:
        product_id = args.get("product_id") or args.get("slug")
        from app.modules.products.repository import ProductRepository
        repo = ProductRepository(self.db)
        prod = await repo.get_by_id_or_slug(product_id)
        if not prod:
            return {"error": "Product not found"}

        variants = []
        for v in prod.variants:
            variants.append({
                "id": v.id,
                "title": v.title,
                "sku": v.sku,
                "price": f"${(v.price_cents / 100):.2f}",
                "stock": v.inventory.available_quantity if v.inventory else 0,
            })

        return {
            "id": prod.id,
            "title": prod.title,
            "brand": prod.brand,
            "description": prod.description,
            "price": f"${(prod.base_price_cents / 100):.2f}",
            "rating": prod.rating_avg,
            "variants": variants,
        }

    async def tool_compare_products(self, args: Dict[str, Any]) -> Dict[str, Any]:
        query = args.get("query", "")
        res = await self.search_service.search(query=query, limit=2)
        if len(res.items) < 2:
            return {"error": "Could not find enough matching products to compare"}

        p1, p2 = res.items[0], res.items[1]
        return {
            "comparison": {
                "product_a": {
                    "title": p1.title,
                    "brand": p1.brand,
                    "price": f"${(p1.base_price_cents / 100):.2f}",
                    "rating": p1.rating_avg,
                },
                "product_b": {
                    "title": p2.title,
                    "brand": p2.brand,
                    "price": f"${(p2.base_price_cents / 100):.2f}",
                    "rating": p2.rating_avg,
                },
            }
        }

    async def tool_check_stock(self, args: Dict[str, Any]) -> Dict[str, Any]:
        variant_id = args.get("variant_id")
        from app.modules.products.repository import ProductRepository
        repo = ProductRepository(self.db)
        variant = await repo.get_variant_by_id(variant_id)
        if not variant or not variant.inventory:
            return {"available": False, "stock": 0}
        return {
            "variant": variant.title,
            "available": variant.inventory.available_quantity > 0,
            "stock": variant.inventory.available_quantity,
        }

    async def tool_get_my_orders(self, args: Dict[str, Any]) -> Dict[str, Any]:
        # Enforce server-side authorization check: current_user must be authenticated
        if not self.current_user:
            return {"message": "Please sign in to your NovaMart account so I can look up your orders securely."}

        from app.modules.orders.repository import OrderRepository
        repo = OrderRepository(self.db)
        orders, _, _ = await repo.get_user_orders(user_id=self.current_user.id, limit=3)

        if not orders:
            return {"message": "You currently have no previous orders on record."}

        return {
            "orders": [
                {
                    "order_number": o.order_number,
                    "date": o.created_at.strftime("%Y-%m-%d"),
                    "status": o.status,
                    "total": f"${(o.total_amount_cents / 100):.2f}",
                    "item_count": len(o.items),
                }
                for o in orders
            ]
        }

    async def tool_add_to_cart_suggestion(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI never executes purchases directly! It returns a suggested product card
        which the customer can review and confirm with one click in the UI.
        """
        variant_id = args.get("variant_id")
        qty = args.get("quantity", 1)
        from app.modules.products.repository import ProductRepository
        repo = ProductRepository(self.db)
        variant = await repo.get_variant_by_id(variant_id)
        if not variant:
            return {"error": "Variant not found"}

        return {
            "type": "cart_suggestion",
            "variant_id": variant.id,
            "product_title": variant.product.title if variant.product else variant.title,
            "variant_title": variant.title,
            "quantity": qty,
            "price": f"${(variant.price_cents / 100):.2f}",
        }

    async def tool_get_store_policies(self, args: Dict[str, Any]) -> Dict[str, Any]:
        topic = args.get("topic", "shipping").lower()
        policy = STORE_POLICIES.get(topic) or STORE_POLICIES["shipping"]
        return {"topic": topic, "policy_summary": policy}

