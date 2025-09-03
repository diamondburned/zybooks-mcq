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

const ZYBOOK_POINTS_QUERY = ".points-completed-text"

// Multiple-Choice Questions
const MCQ_BOX_QUERY = ".multiple-choice-content-resource"
const MCQ_QUERY = ".multiple-choice-question"
const MCQ_CHOICES_QUERY = ".question > .question-choices > .zb-radio-button > input"
const MCQ_CORRECT_EXPLANATION_QUERY = ".zb-explanation.correct"
const MCQ_EXPLANATION_QUERY = ".zb-explanation"

// Short Answers
const SHORT_ANSWER_BOX_QUERY = ".short-answer-content-resource"
const SHORT_ANSWER_QUESTION_QUERY = ".short-answer-question"
const SHORT_ANSWER_SHOW_ANSWER_QUERY = "button.show-answer-button"
const SHORT_ANSWER_RIGHT_ANSWER_QUERY = "span.forfeit-answer"
const SHORT_ANSWER_INPUT_QUERY = "input.zb-input"

// Participation Activities (Annoying Animations)
const PARTICIPATION_BOX_QUERY = ".interactive-activity-container"
const PARTICIPATION_MOVIE_CONTROLS_QUERY = ".animation-controls"
const PARTICIPATION_MOVIE_CONTROLS_START_QUERY = "button.start-button"
const PARTICIPATION_MOVIE_CONTROLS_2X_QUERY = ".speed-control input[type='checkbox']"
const PARTICIPATION_MOVIE_CONTROLS_AGAIN_QUERY = "button[aria-label='Play again']"
const PARTICIPATION_MOVIE_CONTROLS_REVERSE_QUERY = ".rotate-180"
const PARTICIPATION_MOVIE_CONTROLS_PLAY_QUERY = "button[aria-label='Play']"
const PARTICIPATION_MOVIE_CONTROLS_PAUSE_QUERY = "button[aria-label='Pause']"

// Match Activities
const MATCH_BOX_QUERY = ".definition-match-payload.custom-content-resource"
const MATCH_BANK_QUERY = ".term-bank"
const MATCH_TERMS_QUERY = ".definition-match-term"
const MATCH_DEFINITION_ROW_QUERY = ".definition-row"
const MATCH_TERM_BUCKET_QUERY = ".term-bucket"
const MATCH_INCORRECT_QUERY = ".incorrect"

// ===== Helper Functions ===== //

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitUntil(f, ms = 10) {
  while (!f()) { await sleep(ms) }
}

async function simulateKey(target, key) {
  const options = { key, bubbles: true };
  target.dispatchEvent(new KeyboardEvent('keydown', options));
  await sleep(100)
  target.dispatchEvent(new KeyboardEvent('keyup', options));
  await sleep(100)
}

function isCompleted(elem) {
  return !!elem.querySelector("[aria-label='Activity completed']")
}

window.doMCQ = async () => {
  for (let box of document.querySelectorAll(MCQ_BOX_QUERY)) {
    if (isCompleted(box)) continue;

    box.scrollIntoView()

    for (let q of box.querySelectorAll(MCQ_QUERY)) {
      console.log("found question")
      for (let choice of q.querySelectorAll(MCQ_CHOICES_QUERY)) {
        console.log("choice found")
        if (q.querySelector(MCQ_CORRECT_EXPLANATION_QUERY)) {
          console.log("skipping correct")
          break // already correct
        }

        let explanation = q.querySelector(MCQ_EXPLANATION_QUERY)
        choice.click()
        // Wait until the explanation box disappears.
        await waitUntil(() => (!explanation || !explanation.isConnected))
        // Wait until the selection box pops up before continuing.
        await waitUntil(() => (!!q.querySelector(MCQ_EXPLANATION_QUERY)))
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
  for (let box of document.querySelectorAll(SHORT_ANSWER_BOX_QUERY)) {
    if (isCompleted(box)) continue;

    box.scrollIntoView()

    for (let q of box.querySelectorAll(SHORT_ANSWER_QUESTION_QUERY)) {
      const showAnswer = q.querySelector(SHORT_ANSWER_SHOW_ANSWER_QUERY)
      showAnswer.click()
      showAnswer.click()

      await sleep(500)
      console.log(q)
      const answer = q.querySelector(SHORT_ANSWER_RIGHT_ANSWER_QUERY)
        .textContent
        .trim(" ")

      console.log(answer)

      const input = q.querySelector(SHORT_ANSWER_INPUT_QUERY)
      input.value = answer
      input.textContent = answer
      const event = new Event('input', { bubbles: true })
      input.dispatchEvent(event)

      q.querySelector("button.check-button").click()
      await sleep(200)
    }

    await sleep(400)
  }
}

window.doParticipation = async () => {
  console.log("called doParticipation")
//  for (let box of document.querySelectorAll(".interactive-activity-container.animation-player-content-resource")) {
    for (let box of document.querySelectorAll(PARTICIPATION_BOX_QUERY)) {
    console.log("starting participation", box)
    if (isCompleted(box)) {
      console.log("skipping completed")
      continue;
    }

    box.scrollIntoView()

    let controls = box.querySelector(PARTICIPATION_MOVIE_CONTROLS_QUERY)

    if (!controls) {
      continue
    }

    // Click Start.
    console.log("starting animation", controls)
    controls.querySelector(PARTICIPATION_MOVIE_CONTROLS_START_QUERY).click()

    // Enable 2x speed.
    let speed = controls.querySelector(PARTICIPATION_MOVIE_CONTROLS_2X_QUERY)
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

      // No Play button. Check if we have a Play again button. If we
      // do, then bail the loop.
      let again = controls.querySelector(PARTICIPATION_MOVIE_CONTROLS_AGAIN_QUERY)
      if (again) {
        console.log("skipping again button")
        break
      }

      let reversePlay = controls.querySelector(PARTICIPATION_MOVIE_CONTROLS_REVERSE_QUERY)
      if (reversePlay) {
        console.log("skipping again button")
        break
      }

      let play = controls.querySelector(PARTICIPATION_MOVIE_CONTROLS_PLAY_QUERY)
      if (play) {
        play.click()
        continue
      }

      // Check the Pause button. ONLY run the loop if we have a pause
      // button to prevent deadlocking the page.
      let pause = controls.querySelector(PARTICIPATION_MOVIE_CONTROLS_PAUSE_QUERY)
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
  for (let box of document.querySelectorAll(MATCH_BOX_QUERY)) {
    console.log("starting matching", box);
    box.scrollIntoView();

    if (isCompleted(box)) {
      console.log("skipping completed matching activity");
      continue;
    }

    let bank = box.querySelector(MATCH_BANK_QUERY);
    let terms = box.querySelectorAll(MATCH_TERMS_QUERY);
    let rows = box.querySelectorAll(MATCH_DEFINITION_ROW_QUERY);

    console.log("sorting " + terms.length + " terms in match activity");

    // keep track of term buckets that we have filled, by row index
    let filled = [];

    for (var term of terms) {
      // start dragging term element with spacebar hotkey
      term.focus();
      term.click();
      await simulateKey(term, ' ');

      rowIndex = -1;
      for (var row of rows) {
        rowIndex += 1;
        bucket = row.querySelector(MATCH_TERM_BUCKET_QUERY)

        // drag term down
        await simulateKey(term, 'ArrowDown');

        if (filled.includes(rowIndex)) {
          continue;
        }
        // drop the element
        await simulateKey(term, ' ');

        if (row.querySelector(MATCH_INCORRECT_QUERY)) {
          console.log("incorrect, trying next term bucket");
          term = bucket.querySelector(MATCH_TERMS_QUERY);

          // pick up the element again to continue dragging it
          term.focus();
          term.click();
          await simulateKey(term, ' ');
          continue;
        } else {
          console.log("correct");
          filled.push(rowIndex);
          break;
        }
      }
    }
  }
  console.log("matching: all done")
}

window.doAll = async () => {
  await doMCQ()
  await doShortAnswers()
  await doMatch()
  await doParticipation()
  console.log("ALL DONE")

  // display points and flash green to notify user that we're done
  let zybookPoints = document.querySelector(ZYBOOK_POINTS_QUERY);
  zybookPoints.scrollIntoView();

  let oldColor = zybookPoints.style["background-color"];

  for (i = 0; i <= 3; i++) {
    zybookPoints.style["background-color"] = "limegreen";
    await sleep(500);
    zybookPoints.style["background-color"] = oldColor;
    await sleep(500);
  }
}

