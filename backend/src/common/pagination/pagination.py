def paginate(query, limit: int | None, offset: int = 0, order_by=None):
    if order_by is not None:
        query = query.order_by(order_by)

    total = query.order_by(None).count()

    paginated_query = query.offset(offset)
    if limit is not None:
        paginated_query = paginated_query.limit(limit)

    items = paginated_query.all()

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }
