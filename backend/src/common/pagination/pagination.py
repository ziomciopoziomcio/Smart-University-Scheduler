from typing import Any
from src.common.pagination.pagination_model import PaginatedResponse


def paginate(
    query: Any,
    limit: int | None,
    offset: int = 0,
    order_by=None,
    count_query: Any | None = None,
):
    """
    Paginate a SQLAlchemy query.
    - query: query used to fetch page rows (can be a joined query returning tuples).
    - count_query: optional query used to compute total count (should be a base query without JOIN duplicates).
      If None, paginate will use `query` for counting (current behaviour).
    - order_by: column or list of columns to order the fetched rows by.
    """
    if order_by is not None:
        if isinstance(order_by, (list, tuple)):
            query = query.order_by(*order_by)
        else:
            query = query.order_by(order_by)

    cnt_q = count_query if count_query is not None else query
    total = cnt_q.order_by(None).count()

    paginated_query = query.offset(offset)
    if limit is not None:
        paginated_query = paginated_query.limit(limit)

    return PaginatedResponse(
        items=paginated_query.all(),
        total=total,
        limit=limit,
        offset=offset,
    )
