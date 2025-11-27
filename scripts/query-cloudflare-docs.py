#!/usr/bin/env python3

import os
import json
import argparse
import requests
from pathlib import Path
from rich import print
from rich.tree import Tree
from rich.prompt import Prompt
from datetime import datetime

# Configs
CF_MODEL = "@cf/openai/gpt-oss-120b"
CF_API_URL = "https://openai-api-worker.hacolby.workers.dev/v1/chat/completions"
MCP_API_URL = "https://docs.mcp.cloudflare.com/mcp"
DEV_VARS_PATH = Path(".dev.vars")
LOG_DIR = Path("docs/cloudflare-docs")
LOG_DIR.mkdir(parents=True, exist_ok=True)
QUERY_LOG_PATH = LOG_DIR / "query-log.json"


def load_env_token():
    if DEV_VARS_PATH.exists():
        with open(DEV_VARS_PATH) as f:
            for line in f:
                if "CF_API_KEY" in line:
                    return line.strip().split("=", 1)[1]
    return os.getenv("CF_API_KEY")


def render_tree(highlights):
    tree = Tree("[bold cyan]Project Root[/bold cyan]")
    for path in sorted(Path(".").rglob("*")):
        if path.is_file():
            rel = str(path.relative_to("."))
            if any(h["file_path"] == rel for h in highlights):
                tree.add(f"[bold green]{rel}[/bold green]")
            else:
                tree.add(rel)
    return tree


def extract_snippets(files):
    snippets = []
    for f in files:
        try:
            with open(f["file_path"]) as src:
                lines = src.readlines()
                snippet = "".join(lines[f["start_line"] - 1:f["end_line"]])
                snippets.append({
                    "file_path": f["file_path"],
                    "code": snippet,
                    "relation": f["relation_to_question"]
                })
        except Exception as e:
            print(f"[red]Error reading {f['file_path']}: {e}[/red]")
    return snippets


def build_prompt_block(q):
    tree = render_tree(q["relevant_code_files"])
    print(tree)
    code_context = extract_snippets(q["relevant_code_files"])
    return {
        "role": "user",
        "content": f"""
You are preparing a question for the Cloudflare Docs MCP API.

Original Query: {q['query']}
Cloudflare Bindings: {', '.join(q['cloudflare_bindings_involved'])}
Node Libraries: {', '.join(q['node_libs_involved'])}
Tags: {', '.join(q['tags'])}

Relevant Code Snippets:
{json.dumps(code_context, indent=2)}

Folder Structure Highlighting Relevant Files:
{tree}

Please rewrite the question for MCP with full context and formal technical phrasing.
"""
    }


def query_worker_ai(payload):
    token = load_env_token()
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    body = {
        "model": CF_MODEL,
        "messages": [payload]
    }
    resp = requests.post(CF_API_URL, json=body, headers=headers)
    return resp.json()


def query_mcp(prompt):
    return requests.post(MCP_API_URL, json={"prompt": prompt}).json()


def save_log(log):
    timestamp = datetime.utcnow().isoformat()
    file_path = LOG_DIR / f"mcp_result_{timestamp}.json"
    with open(file_path, "w") as f:
        json.dump(log, f, indent=2)
    print(f"[green]Saved to {file_path}[/green]")
    return file_path


def append_query_log(entry):
    if QUERY_LOG_PATH.exists():
        with open(QUERY_LOG_PATH) as f:
            data = json.load(f)
    else:
        data = []
    data.append(entry)
    with open(QUERY_LOG_PATH, "w") as f:
        json.dump(data, f, indent=2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_json", help="Path to questions JSON file")
    args = parser.parse_args()

    with open(args.input_json) as f:
        questions = json.load(f)

    for q in questions:
        prompt = build_prompt_block(q)
        first_worker_resp = query_worker_ai(prompt)
        mcp_resp = query_mcp(first_worker_resp["choices"][0]["message"]["content"])

        second_prompt = {
            "role": "user",
            "content": f"Original Query: {q['query']}\nMCP Response: {mcp_resp}"
        }
        follow_ups = query_worker_ai(second_prompt)

        summary = {
            "original": q,
            "prompt": prompt,
            "worker_first": first_worker_resp,
            "mcp_response": mcp_resp,
            "worker_second": follow_ups
        }

        result_file = save_log(summary)
        append_query_log({"query": q["query"], "log_file": str(result_file)})


if __name__ == "__main__":
    main()
