import firstBy from 'thenby'

const isExternalModule = path => !isInternalModule(path)
const isInternalModule = path =>
  !isLocalModuleFromParentDirectory(path) &&
  !isLocalModuleFromSiblingDirectory(path)
const isLocalModuleFromParentDirectory = path => path.startsWith('../')
const isLocalModuleFromSiblingDirectory = path => path.startsWith('./')

const matchers = [
  isLocalModuleFromSiblingDirectory,
  isLocalModuleFromParentDirectory,
  isExternalModule,
]

export default (file, api, options) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const declarations = root.find(j.ImportDeclaration)

  const sortedDeclarations = declarations
    .nodes()
    .sort(
      firstBy(n =>
        matchers.reduce((acc, matcher) => acc + matcher(n.source.value), 0),
      )
        // .thenBy(
        //   n => n.specifiers.filter(s => s.type === 'ImportSpecifier').length,
        // )
        .thenBy(n => n.source.value)
        .thenBy(n => {
          if (n.specifiers.length === 1) {
            return n.specifiers[0].local.name
          }
        }),
    )
    .map(node => {
      return j.importDeclaration(node.specifiers, j.literal(node.source.value))
    })

  declarations.replaceWith(null)

  root.get().node.program.body.unshift(...sortedDeclarations)
  return root.toSource({
    quote: 'single',
    trailingComma: true,
    reuseWhitespace: false,
  })
}
