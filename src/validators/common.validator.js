import { param } from 'express-validator';
import mongoose from 'mongoose';

export const validateMongoId = [
  param('id')
    .notEmpty()
    .withMessage('ID parameter is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    }),
];

export const validateObjectId = (idField = 'id') => [
  param(idField)
    .notEmpty()
    .withMessage(`${idField} parameter is required`)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${idField} format`);
      }
      return true;
    }),
];
