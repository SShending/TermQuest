import { describe, expect, it } from "vitest";
import { parseCommand } from "./parser";

describe("parseCommand", () => {
  it("accepts the documented git status command with flexible whitespace", () => {
    expect(parseCommand("  git   status  ")).toEqual({
      ok: true,
      command: { type: "git-status" },
    });
  });

  it("accepts a single root file for git add", () => {
    expect(parseCommand("git add login.py")).toEqual({
      ok: true,
      command: { type: "git-add", path: "login.py" },
    });
  });

  it("accepts git add . as the supported stage-all form", () => {
    expect(parseCommand("git add .")).toEqual({
      ok: true,
      command: { type: "git-add", path: null },
    });
  });

  it("accepts the documented unstaging form", () => {
    expect(parseCommand("git restore --staged debug.log")).toEqual({
      ok: true,
      command: { type: "git-restore-staged", path: "debug.log" },
    });
  });

  it("handles empty input without producing a runnable command", () => {
    const result = parseCommand("   ");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("empty_input");
      expect(result.error.message).toMatch(/没有输入命令/);
    }
  });

  it("rejects unknown commands with a useful explanation", () => {
    const result = parseCommand("pwd");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unsupported_command");
      expect(result.error.message).toContain("pwd");
      expect(result.error.message).toContain("受控 Git 命令");
    }
  });

  it("rejects unsupported git subcommands", () => {
    const result = parseCommand("git commit");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unsupported_command");
    }
  });

  it("rejects unsupported status arguments instead of silently ignoring them", () => {
    const result = parseCommand("git status --short");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unsupported_arguments");
      expect(result.error.message).toContain("--short");
    }
  });

  it.each([
    "git add",
    "git add login.py debug.log",
    "git add -A",
    "git restore login.py",
    "git restore --staged",
    "git restore --staged login.py debug.log",
  ])("rejects unsupported arguments and multi-path forms: %s", (input) => {
    const result = parseCommand(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unsupported_arguments");
    }
  });

  it.each([
    "git add /etc/passwd",
    "git add ../login.py",
    "git add src/login.py",
    "git restore --staged ../debug.log",
  ])("rejects absolute, parent, and nested paths: %s", (input) => {
    const result = parseCommand(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_path");
    }
  });

  it.each([
    "git status | cat",
    "git status > output.txt",
    "git status && pwd",
    "git status; pwd",
    "git status $(pwd)",
    "git status `pwd`",
    "git add *.py",
    "git add 'login.py'",
    "git status\ngit add login.py",
  ])("rejects unsupported shell syntax: %s", (input) => {
    const result = parseCommand(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unsupported_syntax");
    }
  });
});
