import { FILTER_OPERATORS } from './constants'
import { ComparisonOperator } from './db'

export function getFilterOperator(param: string) {
  // split param by '_', get the last one
  const operatorKey = param.split('_').pop()
  const field = param.split('_').slice(0, -1).join('_')

  let operator: ComparisonOperator | undefined

  switch (operatorKey) {
    case FILTER_OPERATORS.EQUAL:
      operator = ComparisonOperator.EQUAL
      break
    case FILTER_OPERATORS.NOT_EQUAL:
      operator = ComparisonOperator.NOT_EQUAL
      break
    case FILTER_OPERATORS.FUZZY:
      operator = ComparisonOperator.CONTAINS
      break
    case FILTER_OPERATORS.IN:
      operator = ComparisonOperator.IN
      break
    case FILTER_OPERATORS.NOT_IN:
      operator = ComparisonOperator.NOT_IN
      break
    case FILTER_OPERATORS.GREATER_THAN:
      operator = ComparisonOperator.GREATER_THAN
      break
    case FILTER_OPERATORS.LESS_THAN:
      operator = ComparisonOperator.LESS_THAN
      break
    case FILTER_OPERATORS.GREATER_THAN_OR_EQUAL:
      operator = ComparisonOperator.GREATER_THAN_OR_EQUAL
      break
    case FILTER_OPERATORS.LESS_THAN_OR_EQUAL:
      operator = ComparisonOperator.LESS_THAN_OR_EQUAL
      break
    case FILTER_OPERATORS.BETWEEN:
      operator = ComparisonOperator.BETWEEN
      break
  }
  return { field, operator }
}
