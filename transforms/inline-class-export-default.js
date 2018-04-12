// class A {}
// export default A
//
// export default class A {}

module.exports = function(file, api, options) {
  const j = api.jscodeshift
  const root = j(file.source)

  root.find(j.ExportDefaultDeclaration).forEach((p) => {
    if (p.node.declaration.type === 'Identifier') {
      const matches = root
        .find(j.ClassDeclaration)
        .filter((x) => x.node.id.name === p.node.declaration.name)

      if (matches.size() === 1) {
        p.replace()
        matches.replaceWith(j.exportDefaultDeclaration(matches.nodes()[0]))
      }
    }
  })

  return root.toSource()
}
