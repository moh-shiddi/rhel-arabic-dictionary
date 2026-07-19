#!/usr/bin/env python3
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parent
COMMANDS_FILE = ROOT / "commands.json"
WORKFLOWS_FILE = ROOT / "workflows.seed.json"
ENTITIES_FILE = ROOT / "entities.seed.json"
OUTPUT_FILE = ROOT / "knowledge.json"

COMMAND_PAGE_MAP = {
    "dnf": "cmd-dnf", "yum": "cmd-dnf", "rpm": "cmd-rpm",
    "systemctl": "cmd-systemctl", "journalctl": "cmd-journalctl",
    "firewall-cmd": "cmd-firewall-cmd", "ssh": "cmd-ssh", "ss": "cmd-ss",
    "ip": "cmd-ip", "nmcli": "cmd-nmcli", "find": "cmd-find",
    "grep": "cmd-grep", "chmod": "cmd-chmod", "chown": "cmd-chown",
    "useradd": "cmd-useradd", "usermod": "cmd-usermod", "lsblk": "cmd-lsblk",
    "restorecon": "cmd-restorecon"
}

def first_command_name(command):
    text = str(command or "").strip()
    text = re.sub(r"^sudo\s+", "", text)
    text = re.sub(r"^[A-Z_]+=[^\s]+\s+", "", text)
    first = re.split(r"\s+|\||;", text, maxsplit=1)[0]
    return first.rsplit("/", 1)[-1]

def unique(values):
    return list(dict.fromkeys(item for item in values if item))

def convert_legacy(command):
    command_name = first_command_name(command.get("command"))
    related = [COMMAND_PAGE_MAP[command_name]] if command_name in COMMAND_PAGE_MAP else []
    return {
        "id": f"legacy-{command['id']}",
        "entity_type": "task",
        "content_level": "legacy",
        "title_ar": command["title_ar"],
        "goal_ar": command["title_ar"],
        "summary_ar": command["description_ar"],
        "category": command.get("category", "legacy"),
        "difficulty": "beginner",
        "estimated_minutes": 3,
        "keywords_ar": unique(command.get("keywords_ar", []) + [command["title_ar"], command["command"]]),
        "supported_versions": command.get("rhel_versions", ["8", "9", "10"]),
        "risk": command.get("risk", "low"),
        "prerequisites_ar": ["صلاحية sudo"] if command.get("requires_sudo") else [],
        "variables": [],
        "steps": [{
            "id": "run-command",
            "title_ar": command["title_ar"],
            "command": command["command"],
            "explanation_ar": command["description_ar"],
            "requires_sudo": bool(command.get("requires_sudo")),
            "risk": command.get("risk", "low"),
            "optional": False,
            "expected_result_ar": "",
            "notes_ar": command.get("notes_ar", "")
        }],
        "verification": [], "rollback_ar": [], "common_errors": [],
        "files": [], "ports": [],
        "related_entities": related,
        "tags_ar": ["أمر سريع"],
        "safety_notes_ar": [command["notes_ar"]] if command.get("notes_ar") else [],
        "sources": [], "status": "draft"
    }

def convert_workflow(task):
    item = dict(task)
    old_level = item.get("content_level", "workflow")
    item["entity_type"] = "troubleshooting" if old_level == "troubleshooting" else "task"
    item["related_entities"] = item.pop("related_tasks", item.get("related_entities", []))
    item["tags_ar"] = unique(item.get("tags_ar", []) + (["حل مشكلة"] if item["entity_type"] == "troubleshooting" else ["مسار عملي"]))
    inferred = []
    for step in item.get("steps", []):
        name = first_command_name(step.get("command"))
        if name in COMMAND_PAGE_MAP:
            inferred.append(COMMAND_PAGE_MAP[name])
    item["related_entities"] = unique(item.get("related_entities", []) + inferred)
    return item

def main():
    old = json.loads(COMMANDS_FILE.read_text(encoding="utf-8"))
    workflows = json.loads(WORKFLOWS_FILE.read_text(encoding="utf-8"))
    seed = json.loads(ENTITIES_FILE.read_text(encoding="utf-8"))

    categories = dict(old.get("categories", {}))
    categories.update(workflows.get("categories", {}))
    categories.update(seed.get("categories", {}))

    curated_tasks = [convert_workflow(item) for item in workflows.get("tasks", [])]
    legacy_tasks = [convert_legacy(item) for item in old.get("commands", [])]
    curated_entities = seed.get("entities", [])
    entities = curated_tasks + legacy_tasks + curated_entities

    ids = {item["id"] for item in entities}
    if len(ids) != len(entities):
        raise ValueError("Duplicate entity ids")

    # Remove dangling relation ids and add reverse references for navigation.
    for item in entities:
        item["related_entities"] = unique(x for x in item.get("related_entities", []) if x in ids and x != item["id"])
    by_id = {item["id"]: item for item in entities}
    for item in list(entities):
        for target_id in item.get("related_entities", []):
            target = by_id[target_id]
            reverse = target.setdefault("related_entities", [])
            if item["id"] not in reverse and len(reverse) < 20:
                reverse.append(item["id"])

    output = {
        "schema_version": "3.0.0",
        "project": "RHEL Arabic Knowledge Engine",
        "language": "ar",
        "baseline": old.get("baseline", "Red Hat Enterprise Linux 9"),
        "supported_versions": old.get("supported_versions", ["8", "9", "10"]),
        "entity_types": seed.get("entity_types", {}),
        "categories": categories,
        "entities": entities
    }
    OUTPUT_FILE.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    from collections import Counter
    counts = Counter(item["entity_type"] for item in entities)
    print(f"Created {OUTPUT_FILE}")
    print(f"Total entities: {len(entities)}")
    for key, value in counts.items():
        print(f"- {key}: {value}")

if __name__ == "__main__":
    main()
