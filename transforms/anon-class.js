// const A = class {}
// class A {}

module.exports = function(file, api, options) {
  const j = api.jscodeshift
  const root = j(file.source)

  root
    .find(j.ClassExpression)
    .filter((p) => !p.node.id)
    .closest(j.VariableDeclaration, (p) => p.declarations.length === 1)
    .forEach((p) => {
      const d = p.node.declarations[0]
      p.replace(j.classDeclaration(d.id, d.init.body, d.init.superClass))
    })

  return root.toSource()
}
