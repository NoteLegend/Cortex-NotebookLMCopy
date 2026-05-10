import pdfplumber
from fastapi import APIRouter , UploadFile , File , Form , HTTPException
from typing import Annotated
from app.services.vectorDB import createCollection , deleteSessionId 
from app.services.LLM import handel_user_query
from app.models.query import QueryRequest

router = APIRouter()

async def getSessionId(data: str):
    return await createCollection(data)




@router.post("/uploadDataThroughFile")
async def uploadDataThroughFile(
    file : Annotated[UploadFile , File(description="Upload a pdf or txt file")]
):

    if not file.filename.endswith(('.pdf' , '.txt')):

        raise HTTPException(status_code=400 , detail="file must be either .pdf or .txt")

    data = ""

    if file.filename.endswith('.pdf'):

        with pdfplumber.open(file.file) as pdf:

            for page in pdf.pages:

                data += (page.extract_text() + '\n')


    else:

        data = (await file.read()).decode('utf-8')


    session_id = await getSessionId(data)

    return {"session_id": session_id}





@router.post("/uploadDataThroughRawText")
async def uploadDataThroughRawText(text_data: Annotated[str , Form(description="provide rawa text to upload")]):

    session_id = await getSessionId(text_data)

    return {"session_id": session_id}





@router.post("/query")
async def query_agent(data: QueryRequest):

    output = await handel_user_query(data.query , data.session_id)

    return {"response": output}




@router.delete('/deleteSessionId')
async def delete_session_id(session_id):

    await deleteSessionId(session_id)

    return {"message" : "success!"}
