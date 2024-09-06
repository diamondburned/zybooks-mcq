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
    console.log("found question set")
    if (isCompleted(box)) continue;

    box.scrollIntoView()

    for (let q of box.querySelectorAll(".multiple-choice-question")) {
      console.log("found question")
      for (let choice of q.querySelectorAll(".question > .question-choices > .zb-radio-button > input")) {
        console.log("choice found")
        if (q.querySelector(".zb-explanation.correct")) {
          console.log("skipping correct")
          break // already correct
        }

        let explanation = q.querySelector(".zb-explanation")
        console.log("clicking")
        choice.click()
        // Wait until the explanation box disappears.
        await waitUntil(() => (!explanation || !explanation.isConnected))
        // Wait until the selection box pops up before continuing.
        await waitUntil(() => (!!q.querySelector(".zb-explanation")))
      }
    }

    await sleep(1000)
  }
  console.log("done")
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
  console.log("called doParticipation")
  for (let box of document.querySelectorAll(".interactive-activity-container.animation-player-content-resource")) {
    console.log("starting participation", box)
    if (isCompleted(box)) {
      console.log("skipping completed")
      continue;
    }

    box.scrollIntoView()

    let controls = box.querySelector(".animation-controls")

    // Click Start.
    console.log("starting animation", controls)
    controls.querySelector("button.start-button").click()

    // Enable 2x speed.
    let speed = controls.querySelector(".speed-control input[type='checkbox']")
    if (!speed.checked) speed.click()

    // TODO: there's no timeout in this while true loop. This loop may
    // possibly permanently hang the page until it's closed.

    // Start spamming the Play button.
    await sleep(2000)
    while (true) {
      if (isCompleted(box)) {
        console.log("skipping completed")
        break;
      }
      await sleep(3000)
      let play = controls.querySelector("button[aria-label='Play']")
      console.log("this is play", play)
      if (play) {
        console.log("clicking play")
        play.click()
        await sleep(3000)
        continue
      }

      // No Play button. Check if we have a Play again button. If we
      // do, then bail the loop.
      let again = controls.querySelector("button[aria-label='Play again']")
      if (again) {
        console.log("skipping again button")
        break
      }

      // Check the Pause button. ONLY run the loop if we have a pause
      // button to prevent deadlocking the page.
      let pause = controls.querySelector("button[aria-label='Pause']")
      if (pause) {
        console.log("waiting pause")
        continue
      }

      // Dead loop. Log and bail.
      console.log("No Play, Play again or Pause buttons found. Skipping.", box)
      break
    }
  }
  console.log("participation: all done")
}

window.doAll = async () => {
  await doParticipation()
  await doMCQ()
  await doShortAnswers()
}

