// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import App from "./App";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  };
});

afterEach(() => {
  cleanup();
});

function getDrawer(name = "可疑的工作区辅助面板") {
  return screen.getByRole("dialog", { name });
}

function closeDrawer(name?: string) {
  fireEvent.click(within(getDrawer(name)).getByRole("button", { name: "关闭辅助面板" }));
}

function submitCommand(command: string) {
  fireEvent.change(screen.getByLabelText("输入虚拟终端命令"), {
    target: { value: command },
  });
  fireEvent.click(screen.getByRole("button", { name: "运行命令" }));
}

function enterGit02() {
  closeDrawer();
  submitCommand("git status");
  fireEvent.click(screen.getByRole("button", { name: "查看结算" }));
  fireEvent.click(
    within(getDrawer()).getByRole("button", { name: "进入 GIT-02" }),
  );
}

describe("terminal-first game shell", () => {
  it("opens the mission briefing first and returns to the terminal when closed", () => {
    render(<App />);

    const drawer = getDrawer();
    expect(within(drawer).getByRole("heading", { name: "可疑的工作区" })).toBeTruthy();
    expect(within(drawer).getByRole("tab", { name: "任务" }).getAttribute("aria-selected")).toBe(
      "true",
    );

    closeDrawer();

    expect(screen.queryByRole("dialog")).toBeNull();
    const commandInput = screen.getByLabelText("输入虚拟终端命令");
    const terminalOutput = commandInput.closest(".terminal-output");
    expect(terminalOutput?.querySelector(".terminal-history")).toBeTruthy();
    expect(terminalOutput?.lastElementChild?.classList.contains("command-bar")).toBe(true);
    expect(commandInput.getAttribute("placeholder")).toBeNull();
    expect(screen.queryByRole("button", { name: "运行命令" })).toBeNull();
    fireEvent.change(commandInput, { target: { value: "g" } });
    expect(screen.getByRole("button", { name: "运行命令" }).textContent).toBe("↵");
    expect(screen.getByRole("heading", { level: 1, name: "可疑的工作区" })).toBeTruthy();
  });

  it("opens the requested dock tab and reveals hints without completing the mission", () => {
    render(<App />);
    closeDrawer();

    fireEvent.click(screen.getByRole("button", { name: "打开提示面板" }));
    let drawer = getDrawer();
    expect(within(drawer).getByRole("tab", { name: /提示/ }).getAttribute("aria-selected")).toBe(
      "true",
    );

    fireEvent.click(within(drawer).getByRole("button", { name: "获取第一层提示" }));
    drawer = getDrawer();
    expect(within(drawer).getByText("观察方向")).toBeTruthy();
    expect(within(drawer).getAllByText("1/3")).toHaveLength(2);

    closeDrawer();
    submitCommand("pwd");

    expect(screen.queryByText("GIT-01 已通过")).toBeNull();
    expect(screen.getByText("调查中")).toBeTruthy();
  });

  it("shows a completion banner without opening the debrief automatically", () => {
    render(<App />);
    closeDrawer();

    submitCommand("git status");

    expect(screen.getByText("GIT-01 已通过")).toBeTruthy();
    expect(screen.getByText("On branch main")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "打开通关结算" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "查看结算" }));

    const drawer = getDrawer();
    expect(within(drawer).getByRole("tab", { name: "结算" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(within(drawer).getByRole("heading", { name: "你已经看清了工作区" })).toBeTruthy();
  });

  it("resets from the GIT-01 debrief back to the terminal and allows a replay", () => {
    render(<App />);
    closeDrawer();
    submitCommand("git status");
    fireEvent.click(screen.getByRole("button", { name: "查看结算" }));

    fireEvent.click(within(getDrawer()).getByRole("button", { name: "重新挑战" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("等待调查")).toBeTruthy();
    expect(screen.queryByText("On branch main")).toBeNull();
    expect(screen.queryByRole("button", { name: "打开通关结算" })).toBeNull();

    submitCommand("git status");
    expect(screen.getByText("GIT-01 已通过")).toBeTruthy();
  });

  it("enters GIT-02 from the GIT-01 debrief with a fresh briefing", () => {
    render(<App />);
    enterGit02();

    const drawer = getDrawer("只暂存修复辅助面板");
    expect(within(drawer).getByRole("heading", { name: "只暂存修复" })).toBeTruthy();
    expect(within(drawer).getByRole("tab", { name: "任务" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("heading", { level: 1, name: "只暂存修复" })).toBeTruthy();
    expect(screen.getByText("等待调查")).toBeTruthy();
  });

  it("keeps GIT-02 unfinished after a legal but wrong staging choice", () => {
    render(<App />);
    enterGit02();
    closeDrawer("只暂存修复辅助面板");

    submitCommand("git add debug.log");

    expect(screen.getByText(/\[sandbox\] 已暂存 debug\.log/)).toBeTruthy();
    expect(screen.queryByText("GIT-02 已通过")).toBeNull();
    expect(screen.getByText("调查中")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("supports recovery in GIT-02 and then shows the completion banner without auto-opening debrief", () => {
    render(<App />);
    enterGit02();
    closeDrawer("只暂存修复辅助面板");

    submitCommand("git add debug.log");
    submitCommand("git restore --staged debug.log");
    submitCommand("git add login.py");
    submitCommand("git status");

    expect(screen.getByText("GIT-02 已通过")).toBeTruthy();
    expect(screen.getByText(/Changes to be committed/)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "打开通关结算" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "查看结算" }));
    const drawer = getDrawer("只暂存修复辅助面板");
    expect(within(drawer).getByRole("heading", { name: "下一次提交已经聚焦" })).toBeTruthy();
    expect(within(drawer).queryByRole("button", { name: /进入 GIT-/ })).toBeNull();
  });

  it("resets GIT-02 to a fresh replayable state", () => {
    render(<App />);
    enterGit02();
    closeDrawer("只暂存修复辅助面板");
    submitCommand("git add login.py");
    fireEvent.click(screen.getByRole("button", { name: "查看结算" }));

    fireEvent.click(
      within(getDrawer("只暂存修复辅助面板")).getByRole("button", { name: "重新挑战" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "只暂存修复" })).toBeTruthy();
    expect(screen.getByText("等待调查")).toBeTruthy();
    expect(screen.queryByText("GIT-02 已通过")).toBeNull();

    submitCommand("git add login.py");
    expect(screen.getByText("GIT-02 已通过")).toBeTruthy();
  });
});
