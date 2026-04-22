from pydantic import BaseModel

class DepartmentLogin(BaseModel):
    directorate: str
    name: str
    password: str