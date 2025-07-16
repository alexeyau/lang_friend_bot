"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestGpt = requestGpt;
const axios_1 = __importDefault(require("axios"));
const helpers_1 = require("./helpers");
const model = 'accounts/fireworks/models/deepseek-v3';
function requestGpt(userText, messages, fireworksApiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.post('https://api.fireworks.ai/inference/v1/completions', {
            model: model,
            prompt: (0, helpers_1.getPrompt)(userText, messages),
            max_tokens: 400,
            temperature: 0.7,
            top_p: 0.9,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${fireworksApiKey}`
            }
        });
        return response.data;
    });
}
