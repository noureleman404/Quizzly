import json
from dotenv import load_dotenv
from langchain import LLMChain, PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import re
load_dotenv()


prompt_template = """
You are an expert evaluator. Given the following context from a book, a similar context excerpt, and a student's short answer, evaluate the correctness and give constructive feedback.

Context:
{context}

Student's answer:
{user_answer}

Similar Context from the book:
{similar_context}

Return your evaluation strictly as a JSON object **only** in the following format:

{{
  "is_correct": "yes" or "no",
  "score": integer between 0 and 5,
  "feedback": "brief constructive feedback"
}}
"""

prompt = PromptTemplate(
    input_variables=["context", "user_answer" , "similar_context"],
    template=prompt_template
)

# 2. Initialize the LLM (you can choose your model and parameters)
model = ChatGoogleGenerativeAI(model='gemini-1.5-flash')

# 3. Build the chain
evaluation_chain = LLMChain(llm=model, prompt=prompt)

def clean_json_output(text: str) -> str:
    # Remove triple backticks and optional language hints like ```json
    cleaned = re.sub(r"```(?:json)?\n(.+?)\n```", r"\1", text, flags=re.DOTALL)
    # Also strip whitespace just in case
    return cleaned.strip()

def evaluate_short_answer(user_answer: str, context: str, similar_context: str , maximum_grade: int) -> dict:
    raw_output = evaluation_chain.run(user_answer=user_answer, context=context, similar_context=similar_context)
    cleaned_output = clean_json_output(raw_output)
    try:
        result = json.loads(cleaned_output)
        print(result)
        result["score"] = maximum_grade * result["score"] / 5 
    except json.JSONDecodeError:
        print("Warning: Failed to parse JSON output")
        result = {
            "is_correct": None,
            "score": None,
            "feedback": raw_output  # fallback to raw output
        }
    return result



# context = "The mitochondria is the powerhouse of the cell. It produces ATP by cellular respiration."
# similar_context = "Mitochondria convert oxygen and nutrients into energy for the cell."
# user_answer = "Mitochondria produce energy for the cell by respiration."

# evaluation = evaluate_short_answer(user_answer, context , similar_context , maximum_grade=3)
# print(evaluation)