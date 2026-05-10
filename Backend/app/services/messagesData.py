from app.services.prompts import Llm_system_prompt


map_messages = {}


def getMessages(session_id):
    

    if session_id not in map_messages:
        map_messages[session_id] = [
            {"role" : "system" , "content" : Llm_system_prompt}
        ]

    
    
    return map_messages[session_id]



def deleteSessionIdFromMap(session_id):

    if session_id in map_messages:

        del map_messages[session_id]