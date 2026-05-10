import os
from dotenv import load_dotenv
from huggingface_hub import AsyncInferenceClient

from app.services.vectorDB import getInformation

from app.services.prompts import search_system_prompt

from app.services.messagesData import getMessages

from app.models.llm import Search

load_dotenv()

client = AsyncInferenceClient(
    model = os.getenv("huggingface_model_id"),
    api_key = os.getenv("hugging_face_key")
)





async def handel_user_query(query: str , session_id):


    messages = getMessages(session_id)

    history = "\n".join(f"{m['role']} : {m['content']}" for m in messages if m['role'] != "system")
    history += f"\nuser : {query}"

    response_format = {
        "type" : "json_object"
    }

    search_data_json = (await client.chat_completion(
        messages=[
                {"role" : "system" , "content" : search_system_prompt},
                {"role" : "user" , "content" : history}
        ],
        response_format=response_format
        )).choices[0].message.content

    print(search_data_json)

    search_data = Search.model_validate_json(search_data_json)

    information = ""
    combined_prompt = query

    if search_data.search_query:
        information = await getInformation(session_id=session_id , query_text=search_data.search_query)
        combined_prompt = f"Information:\n{information}\n\nUser Query:\n{query}"

    

    messages.append({"role" : "user" , "content" : combined_prompt})

    response = await client.chat_completion(
        messages=messages
    )

    output = response.choices[0].message.content

    messages[-1] = {"role" : "user" , "content" : query}

    messages.append({"role" : "assistant" , "content" : output})

    return output



    


    
      

    