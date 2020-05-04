"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reporter = (todos, config = { spacing: 2 }) => JSON.stringify(todos, null, config.spacing);
