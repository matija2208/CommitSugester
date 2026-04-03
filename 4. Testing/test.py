from llama_cpp import Llama
import json

llm = Llama(
    model_path="commit-model-q4.gguf",
    n_ctx=4096,
    n_threads=4,       # broj CPU threadova, Ryzen 2200g ima 4
    verbose=False
)


testdata = None
with open('./Scraper/TestSet36.json', 'r') as f:
    testdata = json.load(f)

if(testdata is None):
    print("Failed to load test data.")
    exit(1)

results = []
for item in testdata:
    diff = item['input']
    instruction = item['instruction']
    prompt = f"<|start_header_id|>user<|end_header_id|>\n\n{instruction}\n{diff}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    
    response = llm(
        prompt,
        max_tokens=100,
        temperature=0.1,
        stop=["<|eot_id|>", "<|end_of_text|>"]
    )
    
    results.append({
        'instruction': instruction,
        'diff': diff,
        'responseModel': response['choices'][0]['text'].strip(),
        'responseExpected': item['output']
    })

with open('./results.json', 'w') as f:
    json.dump(results, f, indent=4)