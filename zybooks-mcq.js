// ==UserScript==
// @name        doMCQ()
// @namespace   Violentmonkey Scripts
// @match       https://learn.zybooks.com/zybook/*
// @grant       none
// @version     0.1
// @author      -
// @description 9/18/2021, 4:46:34 PM
// ==/UserScript==

// Usage:
// 1. Ctrl+Shift+C
// 2. await doMCQ()

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitUntil(f, ms = 10) {
  while (!f()) { await sleep(ms) }
}

async function doMCQ() {
  for (let box of document.querySelectorAll(".multiple-choice-content-resource")) {
    box.scrollIntoView()

    for (let q of box.querySelectorAll(".multiple-choice-question")) {
      for (let choice of q.querySelectorAll("fieldset > .zb-radio-button > input")) {
        if (q.querySelector(".zb-explanation.correct")) {
          break // already correct
        }
        
        let explanation = q.querySelector(".zb-explanation")
        choice.click()
        // Wait until the explanation box disappears.
        await waitUntil(() => (!explanation || !explanation.isConnected))
        // Wait until the selection box pops up before continuing.
        await waitUntil(() => (!!q.querySelector(".zb-explanation")))
      }
    }

    await sleep(1000)
  }
}

// doShortAnswers fills all the short answer inputs with the right answer.
// It does NOT submit the box, because Zybooks doesn't update it properly,
// so the user MUST ADD A SPACE INTO THE BOX AND SUBMIT MANUALLY.
async function doShortAnswers() {
  for (let box of document.querySelectorAll(".short-answer-content-resource")) {
    box.scrollIntoView()

    for (let q of box.querySelectorAll(".short-answer-question")) {
      const showAnswer = q.querySelector("button.show-answer-button")
      showAnswer.click()
      showAnswer.click()

      const answer = q.querySelector(".zb-explanation span.forfeit-answer")
        .textContent
        .trim(" ")

      const input = q.querySelector("textarea[aria-labelledby^='short-answer-question-definition']")
      input.value = answer
      input.textContent = answer

      // q.querySelector("button.check-button").click()
      await sleep(200)
    }

    await sleep(400)
  }
}

