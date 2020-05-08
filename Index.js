
const Alexa = require('ask-sdk-core');

/* INTENT HANDLERS */

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Welcome to Decision Tree. Lets cheer you up with a song. Or you are happy af?')
      .reprompt('are you ready to change your mood?')
      .getResponse();
  },
};

const FallbackHandler = {
  // 2018-Nov-21: AMAZON.FallackIntent is currently available in en-* and de-DE locales.
  //              This handler will not be triggered except in those locales, so it can be
  //              safely deployed here in the code for any locale.
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(FALLBACK_MESSAGE)
      .reprompt(FALLBACK_REPROMPT)
      .getResponse();
  },
};




const CouchPotatoIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'CouchPotatoIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
       
      .speak('You don\'t want to know a good song for you? Have fun wasting away on the couch and listen to Im all the way up by DJ Khalid.')
      .getResponse();
     

  },
};

const InProgressRecommendationIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'RecommendationIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    let prompt = '';

    for (const slotName of Object.keys(handlerInput.requestEnvelope.request.intent.slots)) {
      const currentSlot = currentIntent.slots[slotName];
      if (currentSlot.confirmationStatus !== 'CONFIRMED'
                && currentSlot.resolutions
                && currentSlot.resolutions.resolutionsPerAuthority[0]) {
        if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH') {
          if (currentSlot.resolutions.resolutionsPerAuthority[0].values.length > 1) {
            prompt = 'Which would you like';
            const size = currentSlot.resolutions.resolutionsPerAuthority[0].values.length;

            currentSlot.resolutions.resolutionsPerAuthority[0].values
              .forEach((element, index) => {
                prompt += ` ${(index === size - 1) ? ' or' : ' '} ${element.value.name}`;
              });

            prompt += '?';

            return handlerInput.responseBuilder
              .speak(prompt)
              .reprompt(prompt)
              .addElicitSlotDirective(currentSlot.name)
              .getResponse();
          }
        } else if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_NO_MATCH') {
          if (requiredSlots.indexOf(currentSlot.name) > -1) {
            prompt = `What ${currentSlot.name} are you looking for`;

            return handlerInput.responseBuilder
              .speak(prompt)
              .reprompt(prompt)
              .addElicitSlotDirective(currentSlot.name)
              .getResponse();
          }
        }
      }
    }

    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  },
};

const CompletedRecommendationIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'RecommendationIntent'
      && request.dialogState === 'COMPLETED';
  },
  handle(handlerInput) {
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;

    const slotValues = getSlotValues(filledSlots);

    const key = `${slotValues.salaryImportance.resolved}-${slotValues.personality.resolved}-${slotValues.bloodTolerance.resolved}-${slotValues.preferredSpecies.resolved}`;
    const occupation = options[slotsToOptionsMap[key]];

    const speechOutput = 
            `. the song for you is ${occupation.name}`;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('This is Decision Tree. I can help you find your presonality. You can say, tell my personality.')
      .reprompt('Would you like to know or do you want to be a couch potato?')
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Bye')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};


const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

/* CONSTANTS */

const skillBuilder = Alexa.SkillBuilders.custom();
const SKILL_NAME = 'Decision Tree';
const FALLBACK_MESSAGE = `The ${SKILL_NAME} skill can\'t help you with that.  It can recommend the best job for you. Do you want to start your career or be a couch potato?`;
const FALLBACK_REPROMPT = 'What can I help you with?';

const requiredSlots = [
  'preferredSpecies',
  'bloodTolerance',
  'personality',
  'salaryImportance',
];

const slotsToOptionsMap = {
  'unimportant-introvert-low-animals': 20,
  'unimportant-introvert-low-people': 8,
  'unimportant-introvert-high-animals': 1,
  'unimportant-introvert-high-people': 4,
  'unimportant-extrovert-low-animals': 10,
  'unimportant-extrovert-low-people': 3,
  'unimportant-extrovert-high-animals': 11,
  'unimportant-extrovert-high-people': 13,
  'somewhat-introvert-low-animals': 20,
  'somewhat-introvert-low-people': 6,
  'somewhat-introvert-high-animals': 19,
  'somewhat-introvert-high-people': 14,
  'somewhat-extrovert-low-animals': 2,
  'somewhat-extrovert-low-people': 12,
  'somewhat-extrovert-high-animals': 17,
  'somewhat-extrovert-high-people': 16,
  'very-introvert-low-animals': 9,
  'very-introvert-low-people': 15,
  'very-introvert-high-animals': 17,
  'very-introvert-high-people': 7,
  'very-extrovert-low-animals': 17,
  'very-extrovert-low-people': 0,
  'very-extrovert-high-animals': 1,
  'very-extrovert-high-people': 5,
};

const options = [
  { name: 'everyday', description: '' },
  { name: 'good life', description: '' },
  { name: 'count on me', description: '' },
  { name: 'everybody hates me', description: '' },
  { name: 'shotgun', description: '' },
  { name: 'im so tired', description: '' },
  { name: 'life is a highway', description: '' },
  { name: 'young', description: '' },
  { name: 'all the stars', description: '' },
  { name: 'psycho', description: '' },
  { name: 'rise', description: '' },
  { name: 'all night', description: '' },
  { name: 'lights down low', description: '' },
  { name: 'Forbidden voices', description: '' },
  { name: 'This is what you came for', description: '' },
  { name: 'Executive', description: '' },
  { name: 'adoring', description: '' },
  { name: 'First time', description: '' },
  { name: 'Lily', description: '' },
  { name: 'somebody', description: '' },
  { name: 'high on life', description: '' },
];

/* HELPER FUNCTIONS */

function getSlotValues(filledSlots) {
  const slotValues = {};

  console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;

    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case 'ER_SUCCESS_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            isValidated: true,
          };
          break;
        case 'ER_SUCCESS_NO_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        synonym: filledSlots[item].value,
        resolved: filledSlots[item].value,
        isValidated: false,
      };
    }
  }, this);

  return slotValues;
}

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    CouchPotatoIntent,
    InProgressRecommendationIntent,
    CompletedRecommendationIntent,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();