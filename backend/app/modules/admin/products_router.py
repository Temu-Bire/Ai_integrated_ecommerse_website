"""
Admin Product Management Router.
Role-gated endpoints for creating, updating, and soft-deleting products and adjusting inventory.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import require_role
from app.modules.products.schemas import (
    InventoryResponse,
    InventoryUpdateRequest,
    ProductCreateRequest,
    ProductDetailResponse,
    ProductUpdateRequest,
)
from app.modules.products.service import ProductService

router = APIRouter(
    prefix="/admin",
    tags=["Admin Catalog Management"],
    dependencies=[Depends(require_role("admin"))],
)


@router.post(
    "/products",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product with variants, initial inventory, and images",
)
async def create_product(
    req: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.create_product(req)


@router.put(
    "/products/{id}",
    response_model=ProductDetailResponse,
    summary="Update product details",
)
async def update_product(
    id: str,
    req: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.update_product(id, req)


@router.delete(
    "/products/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a product from catalog",
)
async def delete_product(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    await service.delete_product(id)
    return None


@router.patch(
    "/inventory/{variant_id}",
    response_model=InventoryResponse,
    summary="Adjust inventory stock levels for a product variant",
)
async def update_inventory(
    variant_id: str,
    req: InventoryUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.update_inventory(variant_id, req)

