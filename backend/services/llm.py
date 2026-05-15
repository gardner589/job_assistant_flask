import os
import json
import logging

logger = logging.getLogger(__name__)

_llm = None

SYSTEM_PROMPT = """You are an expert job application assistant. Analyze the provided resume and job posting, then return a JSON object with these exact fields:
- tailoredResume: The resume rewritten to highlight experience most relevant to this job (preserve all facts)
- coverLetter: A compelling, professional cover letter tailored to this specific role and company
- alignmentScore: An integer from 0 to 100 representing how well the candidate matches the job requirements
- alignmentSummary: 2-3 sentences explaining the score, noting key matches and gaps
- missingKeywords: An array of strings — important skills/keywords from the job description absent from the resume
- strengths: An array of 3-5 strings — specific strengths from the resume that align with this job

Return ONLY valid JSON. No markdown fences, no extra text."""


def get_llm():
    global _llm
    if _llm is None:
        from llama_cpp import Llama
        model_path = os.environ.get('MODEL_PATH', '/app/model.gguf')
        n_threads = int(os.environ.get('LLM_THREADS', '4'))
        logger.info('Loading model from %s ...', model_path)
        _llm = Llama(
            model_path=model_path,
            n_ctx=4096,
            n_threads=n_threads,
            verbose=False,
        )
        logger.info('Model loaded.')
    return _llm


def analyze_application(resume_content, job_content):
    llm = get_llm()

    response = llm.create_chat_completion(
        messages=[
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': f'RESUME:\n{resume_content}\n\nJOB POSTING:\n{job_content}'},
        ],
        max_tokens=4096,
        temperature=0.3,
    )

    text = response['choices'][0]['message']['content'].strip()

    # Strip markdown code fences if the model wraps output
    if text.startswith('```'):
        lines = text.splitlines()
        start = 1
        end = len(lines) - 1 if lines[-1].strip() == '```' else len(lines)
        text = '\n'.join(lines[start:end])

    return json.loads(text)
