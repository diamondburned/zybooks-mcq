// ==UserScript==
// @name        doMCQ()
// @namespace   Violentmonkey Scripts
// @match       https://learn.zybooks.com/*
// @grant       none
// @version     0.1
// @author      -
// @description 9/18/2021, 4:46:34 PM
// ==/UserScript==

// Usage:
// 1. Ctrl+Shift+C
// 2. await doAll()

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitUntil(f, ms = 10) {
  while (!f()) { await sleep(ms) }
}

function isCompleted(elem) {
  return !!elem.querySelector("[aria-label='Activity completed']")
}

window.doMCQ = async () => {
  for (let box of document.querySelectorAll(".multiple-choice-content-resource")) {
    if (isCompleted(box)) continue;

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
window.doShortAnswers = async () => {
  for (let box of document.querySelectorAll(".short-answer-content-resource")) {
    if (isCompleted(box)) continue;

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

window.doParticipation = async () => {
  for (let box of document.querySelectorAll(".animation-player-content-resource")) {
    //if (isCompleted(box)) continue;

    box.scrollIntoView()

    let controls = box.querySelector(".animation-controls")

    // Click Start.
    controls.querySelector("button.start-button").click()

    // Enable 2x speed.
    let speed = controls.querySelector(".speed-control input[type='checkbox']")
    if (!speed.checked) speed.click()

    // TODO: there's no timeout in this while true loop. This loop may
    // possibly permanently hang the page until it's closed.

    // Start spamming the Play button.
    while (true) {
      let play = controls.querySelector("button[aria-label='Play']")
      if (play) {
        play.click()
        continue
      }

      // No Play button. Check if we have a Play again button. If we
      // do, then bail the loop.
      let again = controls.querySelector("button[aria-label='Play again']")
      if (again) {
        break
      }

      // Check the Pause button. ONLY run the loop if we have a pause
      // button to prevent deadlocking the page.
      let pause = controls.querySelector("button[aria-label='Pause']")
      if (pause) {
        await sleep(100)
        continue
      }

      // Dead loop. Log and bail.
      console.log("No Play, Play again or Pause buttons found. Skipping.", box)
      break
    }
  }
}

window.doAll = async () => {
  await doParticipation()
  await doMCQ()
  await doShortAnswers()
}
