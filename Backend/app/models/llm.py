from pydantic import BaseModel

class Search(BaseModel):
    need_search: bool
    search_query: str | None = None