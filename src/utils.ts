import { FILTER_OPERATORS } from './constants'
import { ComparisonOperator } from './db'

export function getFilterOperator(param: string) {
  // split param by '_', get the last one
  const operator = param.split('_').pop()
  switch (operator) {
    case FILTER_OPERATORS.EQUAL:
      return ComparisonOperator.EQUAL
    case FILTER_OPERATORS.NOT_EQUAL:
      return ComparisonOperator.NOT_EQUAL
    case FILTER_OPERATORS.FUZZY:
      return ComparisonOperator.CONTAINS
    case FILTER_OPERATORS.IN:
      return ComparisonOperator.IN
    case FILTER_OPERATORS.NOT_IN:
      return ComparisonOperator.NOT_IN
    case FILTER_OPERATORS.GREATER_THAN:
      return ComparisonOperator.GREATER_THAN
    case FILTER_OPERATORS.LESS_THAN:
      return ComparisonOperator.LESS_THAN
    case FILTER_OPERATORS.GREATER_THAN_OR_EQUAL:
      return ComparisonOperator.GREATER_THAN_OR_EQUAL
    case FILTER_OPERATORS.LESS_THAN_OR_EQUAL:
      return ComparisonOperator.LESS_THAN_OR_EQUAL
    case FILTER_OPERATORS.BETWEEN:
      return ComparisonOperator.BETWEEN
    default:
      return ComparisonOperator.EQUAL
  }
}
