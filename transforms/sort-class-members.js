const methodsOrder = [
  'static-methods',
  'displayName',
  'propTypes',
  'contextTypes',
  'childContextTypes',
  'mixins',
  'statics',
  'defaultProps',
  'class-properties',
  'constructor',
  'getDefaultProps',
  'state',
  'getInitialState',
  'getChildContext',
  'componentWillMount',
  'componentDidMount',
  'componentWillReceiveProps',
  'shouldComponentUpdate',
  'componentWillUpdate',
  'componentDidUpdate',
  'componentWillUnmount',
  '/^on.+$/',
  // '/^(get|set)(?!(InitialState$|DefaultProps$|ChildContext$)).+$/',
  '/^render.+$/',
  'render',
  // 'everything-else',
]

module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const propertyComparator = (a, b) => {
    const nameA = a.key.name
    const nameB = b.key.name

    const indexA = getCorrectIndex(methodsOrder, a) // eslint-disable-line no-use-before-define
    const indexB = getCorrectIndex(methodsOrder, b) // eslint-disable-line no-use-before-define

    const sameLocation = indexA === indexB

    if (sameLocation) {
      // compare lexically
      return +(nameA > nameB) || +(nameA === nameB) - 1
    } else {
      // compare by index
      return indexA - indexB
    }
  }

  const sortClassProperties = (classPath) => {
    const spec = classPath.value.body

    if (spec) {
      spec.body.sort(propertyComparator)
    }
  }

  const es6ClassSortCandidates = root.find(j.ClassDeclaration)

  if (es6ClassSortCandidates.size() > 0) {
    es6ClassSortCandidates.forEach(sortClassProperties)
  }

  return root.toSource()
}

const regExpRegExp = /\/(.*)\/([g|y|i|m]*)/

function selectorMatches(selector, method) {
  if (method.static && selector === 'static-methods') {
    return true
  }

  if (method.type === 'ClassProperty' && selector === 'class-properties') {
    return true
  }

  const methodName = method.key.name

  if (selector === methodName) {
    return true
  }

  const selectorIsRe = regExpRegExp.test(selector)

  if (selectorIsRe) {
    const match = selector.match(regExpRegExp)
    const selectorRe = new RegExp(match[1], match[2])
    return selectorRe.test(methodName)
  }

  return false
}

function getCorrectIndex(methodsOrder, method) {
  const everythingElseIndex = methodsOrder.indexOf('everything-else')

  for (let i = 0; i < methodsOrder.length; i++) {
    if (i != everythingElseIndex && selectorMatches(methodsOrder[i], method)) {
      return i
    }
  }

  if (everythingElseIndex >= 0) {
    return everythingElseIndex
  } else {
    return Infinity
  }
}
