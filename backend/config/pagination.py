from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Default paging, but the client may ask for a different page size.

    The public site is happy with 10. The admin panel wants both ends of the
    range: `page_size=1` just to read `count` for the dashboard tiles, and
    larger pages so a manageable list (skills, say) fits in one request.
    """

    page_size_query_param = 'page_size'
    max_page_size = 100
