import requests
import json
import time
import re
import os

MERGE_MAX = 10

TOKEN = os.getenv("GITHUB_TOKEN")

HEADERS_JSON = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {TOKEN}"
}

HEADERS_DIFF = {
    "Accept": "application/vnd.github.v3.diff",
    "Authorization": f"Bearer {TOKEN}"
}

import re

def classify_commit(message):
    msg = message.lower().strip()
    
    # CC format vec
    if re.match(r'^(fix|feat|refactor|docs|test|chore|perf|ci|build)(\(.+\))?!?: .+', msg):
        return "cc", message
    
    # Linux/Go stil: "subsystem: description"
    if re.match(r'^[a-z][a-z0-9/_-]+: .{10,}', msg):
        prefix, desc = msg.split(": ", 1)
        if any(t in prefix for t in ['fix', 'bug', 'patch']):
            return "fixable", f"fix: {desc}"
        if any(t in prefix for t in ['add', 'new', 'feat', 'implement']):
            return "fixable", f"feat: {desc}"
        return "subsystem", message  # zadrzi original
    
    # "Fix ...", "Add ...", "Update ..." u imperativu
    imperative = re.match(r'^(fix|add|remove|update|refactor|improve|implement|change|rename|move|delete)\s+(.+)', msg, re.I)
    if imperative:
        verb = imperative.group(1).lower()
        desc = imperative.group(2)
        type_map = {
            'fix': 'fix', 'add': 'feat', 'implement': 'feat',
            'remove': 'chore', 'update': 'chore', 'refactor': 'refactor',
            'improve': 'perf', 'change': 'chore', 'rename': 'refactor',
            'move': 'refactor', 'delete': 'chore'
        }
        t = type_map.get(verb, 'chore')
        return "normalized", f"{t}: {desc}"
    
    # Odbaci sve ostalo (Merge, WIP, version bumps, itd.)
    bad = [r'^merge', r'^wip', r'^v\d+\.\d+', r'^revert', r'^\d+\.\d+']
    if any(re.match(p, msg) for p in bad):
        return "junk", None
    
    return "unknown", None

# Koristi ovako:


is_cc = lambda msg: re.match(r'^(feat|fix|chore|docs|refactor|test|style|perf)(\([^)]+\))?: .+', msg)

owners = json.load(open("input.json"))

result = []

mergeCounter=0
ccCounter=0

for i in range(len(owners)):
    print(int((i / len(owners)) * 100), "%")
    owner = owners[i]

    OWNER = owner["owner"]
    REPO = owner["name"]

    print(f"Processing repository: {OWNER}/{REPO}")

    page = 1
    counter = 0

    while(counter<owner["count"]):
        commits_url = f"https://api.github.com/repos/{OWNER}/{REPO}/commits?per_page={owner['count']} &page={page}"
        
        response = requests.get(commits_url, headers=HEADERS_JSON)
        if response.status_code != 200:
            print(f"Error fetching commits for {OWNER}/{REPO}: {response.status_code}")
            print("\t",response.status_code)
            print(f"\t{response.text}")
            print(f"\t{response.headers}")
            continue
        
        commits = response.json()



        for c in commits:
            sha = c["sha"]
            # commit message
            message = c["commit"]["message"]
            if(len(message) < 10 or len(message) > 300):
                continue

            if(("Merge pull request") in message or ("Merge branch") in message):
                continue

            # 2. uzmi DIFF kao git output
            diff_url = f"https://api.github.com/repos/{OWNER}/{REPO}/commits/{sha}"
            diff_text = requests.get(diff_url, headers=HEADERS_DIFF).text
            if(len(diff_text) < 10 or len(diff_text) > 6000):
                continue
            
            if(is_cc(message)):
                ccCounter += 1
            
            instruction = "Napisi konciznu git commit poruku baziranu na datom git diff-u."
            result.append({
                "instruction": instruction,
                "output": message,
                "input": diff_text,
                # "metadata": {
                #     "owner": OWNER,
                #     "repo": REPO,
                #     "sha": sha
                # }
            })
            counter += 1
            if(counter==owner["count"]):
                break
            time.sleep(0.2)
        page += 1       
    print(f"Collected {counter} commits for {OWNER}/{REPO}, moving to next repository.")

keep = []
for record in result:
    category, normalized = classify_commit(record["output"])
    if normalized:
        record["output"] = normalized
        keep.append(record)

with open("output.jsonl", "w", encoding="utf-8") as file:
    for item in keep:
        json.dump(item, file)
        file.write("\n")
with open("output.json", "w", encoding="utf-8") as file:
    json.dump(keep, file, indent=4)

print("Done! ", len(keep), " commits collected. Merge commits: ", mergeCounter, " Conventional Commits: ", ccCounter, "\007")