from src.common.pagination.pagination_model import PaginatedResponse


def paginate(query, limit: int | None, offset: int = 0, order_by=None):
    if order_by is not None:
        if isinstance(order_by, (list, tuple)):
            query = query.order_by(*order_by)
        else:
            query = query.order_by(order_by)

    total = query.order_by(None).count()

    paginated_query = query.offset(offset)
    if limit is not None:
        paginated_query = paginated_query.limit(limit)

    return PaginatedResponse(
        items=paginated_query.all(),
        total=total,
        limit=limit,
        offset=offset,
    )
