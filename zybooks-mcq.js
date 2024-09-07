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
      console.log("found question")
      for (let choice of q.querySelectorAll(".question > .question-choices > .zb-radio-button > input")) {
        console.log("choice found")
        if (q.querySelector(".zb-explanation.correct")) {
          console.log("skipping correct")
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
//  for (let box of document.querySelectorAll(".interactive-activity-container.animation-player-content-resource")) {
    for (let box of document.querySelectorAll(".interactive-activity-container")) {

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
      await sleep(3000)
      if (isCompleted(box)) {
        console.log("skipping completed")
        break;
      }
      let play = controls.querySelector("button[aria-label='Play']")
      if (play) {
        play.click()
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

window.doMatch = async () => {
  console.log("called match")
  for (let box of document.querySelectorAll(".definition-match-payload.custom-content-resource")) {
    console.log("starting matching", box)
    box.scrollIntoView()

    if (isCompleted(box)) {
      console.log("skipping completed")
      continue;
    }

    let bank = box.querySelector(".draggable-object-target.ember-view")
    let terms = box.querySelectorAll(".draggable-object")
    let destrows = box.querySelectorAll(".definition-row")

    for (var term of terms){
      for (var destrow of destrows){
        dest = destrow.querySelector(".draggable-object-target.definition-drag-container")
        if (dest.querySelector(".draggable-object")) {
          // skipping already filled box
          console.log("skipping filled box")
          continue
        }
        drag(term, dest)
        await sleep(1000)
        if (destrow.querySelector(".incorrect")) {
          console.log("incorrect, reverting")
          h = dest.querySelector(".draggable-object")
          drag(h,bank)
          await sleep(1000)
          z = bank.querySelectorAll(".draggable-object")
          term = z[z.length-1]
          console.log(term)
          continue;
        } else {
          console.log("correct")
          break;
        }
      }
    }
  }
  console.log("matching: all done")
}

function drag(srcObj, dstObj) {
  console.log("dragging", srcObj, dstObj)
  // Create a custom drag event
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer()
  });

  // Dispatch the dragstart event on the source object
  srcObj.dispatchEvent(dragStartEvent);

  // Create a custom dragover event
  const dragOverEvent = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dragStartEvent.dataTransfer
  });

  // Dispatch the dragover event on the destination object
  dstObj.dispatchEvent(dragOverEvent);

  // Create a custom drop event
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dragStartEvent.dataTransfer
  });

  // Dispatch the drop event on the destination object
  dstObj.dispatchEvent(dropEvent);

  // Create a custom dragend event
  const dragEndEvent = new DragEvent('dragend', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dragStartEvent.dataTransfer
  });

  // Dispatch the dragend event on the source object
  srcObj.dispatchEvent(dragEndEvent);
}

window.doAll = async () => {
  await doParticipation()
  await doMCQ()
//  await doShortAnswers()
  await doMatch()
  console.log("ALL DONE")
}

