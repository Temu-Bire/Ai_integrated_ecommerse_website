"""
Realistic Sample Data Seeder.
Populates roles, administrator account, customer accounts, categories, products, variants,
inventory, images, and reviews.
"""

import asyncio
import json
import uuid
from app.core.database import AsyncSessionLocal, init_db
from app.core.logging import logger
from app.core.security import hash_password
from app.modules.auth.models import Role, User
from app.modules.categories.models import Category
from app.modules.products.models import (
    Inventory,
    Product,
    ProductEmbedding,
    ProductImage,
    ProductVariant,
)
from app.modules.reviews.models import Review
from app.modules.users.models import Address


async def seed() -> None:
    logger.info("Initializing database schema...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select
        res = await session.execute(select(Role).where(Role.name == "admin"))
        if res.scalar_one_or_none():
            logger.info("Database is already seeded with initial data.")
            return

        logger.info("Seeding roles...")
        admin_role = Role(name="admin", description="System administrator with full permissions")
        customer_role = Role(name="customer", description="Standard e-commerce shopper")
        moderator_role = Role(name="moderator", description="Catalog and review moderator")
        session.add_all([admin_role, customer_role, moderator_role])
        await session.flush()

        logger.info("Seeding users...")
        admin_user = User(
            email="admin@novamart.com",
            hashed_password=hash_password("Admin@123456!"),
            full_name="Alex Vance (Admin)",
            role_id=admin_role.id,
            is_active=True,
            is_verified=True,
        )

        customer_user = User(
            email="customer@novamart.com",
            hashed_password=hash_password("Customer@123456!"),
            full_name="Sarah Connor",
            role_id=customer_role.id,
            is_active=True,
            is_verified=True,
        )
        session.add_all([admin_user, customer_user])
        await session.flush()

        # Seed address for customer
        customer_address = Address(
            user_id=customer_user.id,
            full_name="Sarah Connor",
            phone="+1 (555) 234-5678",
            address_line1="1044 Tech Center Way",
            address_line2="Suite 400",
            city="San Francisco",
            state="CA",
            postal_code="94107",
            country="US",
            is_default_shipping=True,
            is_default_billing=True,
        )
        session.add(customer_address)

        logger.info("Seeding categories...")
        cat_audio = Category(
            name="Audio & Headphones",
            slug="audio-headphones",
            description="Studio-grade wireless headphones, noise-canceling earbuds, and Hi-Fi speakers.",
            image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
            sort_order=1,
        )
        cat_computing = Category(
            name="Laptops & Computers",
            slug="laptops-computers",
            description="High-performance ultrabooks, creator workstations, and next-gen gaming laptops.",
            image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
            sort_order=2,
        )
        cat_wearables = Category(
            name="Smart Wearables",
            slug="smart-wearables",
            description="Fitness trackers, health monitors, and cellular smartwatches.",
            image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
            sort_order=3,
        )
        cat_smartphones = Category(
            name="Smartphones & Accessories",
            slug="smartphones-accessories",
            description="Flagship 5G smartphones, wireless chargers, and protective cases.",
            image_url="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80",
            sort_order=4,
        )
        session.add_all([cat_audio, cat_computing, cat_wearables, cat_smartphones])
        await session.flush()

        logger.info("Seeding products & variants...")
        # Product 1: SonicPro Noise Cancelling Headphones
        p1 = Product(
            category_id=cat_audio.id,
            title="SonicPro Spatial Noise-Cancelling Headphones",
            slug="sonicpro-spatial-noise-cancelling-headphones",
            brand="AeroSound",
            description="Experience breathtaking acoustic clarity with 45mm custom dynamic drivers, 40-hour battery life, hybrid active noise cancellation, and lossless spatial audio with head tracking.",
            base_price_cents=29999,  # $299.99
            currency="USD",
            is_active=True,
            is_featured=True,
            rating_avg=4.8,
            review_count=124,
            search_text="SonicPro Spatial Noise-Cancelling Headphones AeroSound audio wireless bluetooth ANC",
        )
        session.add(p1)
        await session.flush()

        v1_black = ProductVariant(
            product_id=p1.id,
            sku="AERO-SP-BLK",
            title="SonicPro - Matte Black",
            price_cents=29999,
            currency="USD",
            attributes_json=json.dumps({"color": "Matte Black", "edition": "Standard"}),
        )
        v1_silver = ProductVariant(
            product_id=p1.id,
            sku="AERO-SP-SLV",
            title="SonicPro - Arctic Silver",
            price_cents=31999,
            currency="USD",
            attributes_json=json.dumps({"color": "Arctic Silver", "edition": "Special"}),
        )
        session.add_all([v1_black, v1_silver])
        await session.flush()

        inv1_b = Inventory(variant_id=v1_black.id, quantity=50, reserved_quantity=2, low_stock_threshold=10)
        inv1_s = Inventory(variant_id=v1_silver.id, quantity=35, reserved_quantity=0, low_stock_threshold=5)
        img1_1 = ProductImage(product_id=p1.id, url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80", alt_text="SonicPro Headphones Front View", is_primary=True, sort_order=0)
        img1_2 = ProductImage(product_id=p1.id, url="https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80", alt_text="SonicPro Headphones Angle View", is_primary=False, sort_order=1)
        
        # Synthetic embedding vector for semantic search testing (dimension: 8 for mockup, or normalized)
        emb1 = ProductEmbedding(
            product_id=p1.id,
            embedding_json=json.dumps([0.15, -0.22, 0.45, 0.88, -0.05, 0.32, 0.12, -0.65]),
            content_hash="hash_p1",
            model_name="text-embedding-004",
        )
        session.add_all([inv1_b, inv1_s, img1_1, img1_2, emb1])

        # Product 2: ApexBook Pro 16 M-Creator
        p2 = Product(
            category_id=cat_computing.id,
            title="ApexBook Ultra 16 Creator Workstation",
            slug="apexbook-ultra-16-creator-workstation",
            brand="OmniTech",
            description="The premier workstation for video editors, AI engineers, and 3D artists. Powered by a 14-core processor, liquid vapor-chamber cooling, 120Hz Mini-LED display, and 32GB unified high-bandwidth memory.",
            base_price_cents=199900,  # $1,999.00
            currency="USD",
            is_active=True,
            is_featured=True,
            rating_avg=4.9,
            review_count=89,
            search_text="ApexBook Ultra 16 Creator Workstation OmniTech laptop notebook computer 32GB RAM Mini-LED",
        )
        session.add(p2)
        await session.flush()

        v2_32gb = ProductVariant(
            product_id=p2.id,
            sku="OMNI-AB16-32",
            title="ApexBook 16 (32GB RAM / 1TB SSD)",
            price_cents=199900,
            currency="USD",
            attributes_json=json.dumps({"ram": "32GB", "storage": "1TB SSD", "color": "Space Gray"}),
        )
        v2_64gb = ProductVariant(
            product_id=p2.id,
            sku="OMNI-AB16-64",
            title="ApexBook 16 (64GB RAM / 2TB SSD)",
            price_cents=249900,
            currency="USD",
            attributes_json=json.dumps({"ram": "64GB", "storage": "2TB SSD", "color": "Space Gray"}),
        )
        session.add_all([v2_32gb, v2_64gb])
        await session.flush()

        inv2_32 = Inventory(variant_id=v2_32gb.id, quantity=20, reserved_quantity=1, low_stock_threshold=5)
        inv2_64 = Inventory(variant_id=v2_64gb.id, quantity=15, reserved_quantity=0, low_stock_threshold=3)
        img2_1 = ProductImage(product_id=p2.id, url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80", alt_text="ApexBook Ultra Open View", is_primary=True, sort_order=0)
        emb2 = ProductEmbedding(
            product_id=p2.id,
            embedding_json=json.dumps([-0.35, 0.42, 0.15, -0.18, 0.75, -0.12, 0.38, 0.44]),
            content_hash="hash_p2",
            model_name="text-embedding-004",
        )
        session.add_all([inv2_32, inv2_64, img2_1, emb2])

        # Product 3: PulseBand Elite Fitness Smartwatch
        p3 = Product(
            category_id=cat_wearables.id,
            title="PulseBand Elite Cellular Health & GPS Watch",
            slug="pulseband-elite-cellular-health-gps-watch",
            brand="PulseTech",
            description="Continuous ECG, VO2 max monitoring, sapphire glass face, titanium casing, and 7-day battery endurance. Certified water resistant up to 50 meters with dual-frequency precision GPS.",
            base_price_cents=34999,  # $349.99
            currency="USD",
            is_active=True,
            is_featured=True,
            rating_avg=4.7,
            review_count=65,
            search_text="PulseBand Elite Cellular Health GPS Watch PulseTech wearable smartwatch fitness tracker titanium",
        )
        session.add(p3)
        await session.flush()

        v3_black = ProductVariant(
            product_id=p3.id,
            sku="PULSE-ELT-BLK",
            title="PulseBand Elite - Black Titanium (45mm)",
            price_cents=34999,
            currency="USD",
            attributes_json=json.dumps({"case_size": "45mm", "material": "Titanium", "band_color": "Obsidian"}),
        )
        session.add(v3_black)
        await session.flush()

        inv3_b = Inventory(variant_id=v3_black.id, quantity=40, reserved_quantity=0, low_stock_threshold=8)
        img3_1 = ProductImage(product_id=p3.id, url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80", alt_text="PulseBand Elite Watch Front", is_primary=True, sort_order=0)
        emb3 = ProductEmbedding(
            product_id=p3.id,
            embedding_json=json.dumps([0.05, 0.12, -0.35, 0.48, 0.25, 0.82, -0.28, 0.14]),
            content_hash="hash_p3",
            model_name="text-embedding-004",
        )
        session.add_all([inv3_b, img3_1, emb3])

        # Add sample reviews
        r1 = Review(
            product_id=p1.id,
            user_id=customer_user.id,
            rating=5,
            title="Unbelievable sound isolation on flights!",
            comment="The active noise cancellation completely silences airplane engine rumble. Battery lasted my entire round trip without needing a recharge.",
            is_verified_purchase=True,
            status="approved",
        )
        session.add(r1)

        await session.commit()
        logger.info("Database seeding successfully completed!")


if __name__ == "__main__":
    asyncio.run(seed())

