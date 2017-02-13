'use strict';

var INTERNAL_VARIABLES = [
  'pug',
  'pug_mixins',
  'pug_interp',
  'pug_debug_filename',
  'pug_debug_line',
  'pug_debug_sources',
  'pug_html',
  'buf'
];


/**
 * Module dependencies.
 */
var BaseCodeGenerator = require('./pug-code-gen-module.js').CodeGenerator;
var t = require('babel-types');
var babelTemplate = require('babel-template');

/**
 * Inherit from base code generator
 */
module.exports = generateCode;
module.exports.CodeGenerator = Compiler;
function generateCode(ast, options) {
  return (new Compiler(ast, options)).compile();
}

function Compiler(node, options) {
  BaseCodeGenerator.call(this, node, options);
  this.useGenerators = true;
  this.templateVars = ['locals', 'pug', 'buf'];
}
Compiler.prototype = Object.create(BaseCodeGenerator.prototype);
Compiler.prototype.constructor = Compiler;

Compiler.prototype.btpl_addWith = function() {
  var globals = this.options.globals ? this.options.globals.concat(INTERNAL_VARIABLES) : INTERNAL_VARIABLES;
  globals.concat(this.runtimeFunctionsUsed.map(function (name) { return 'pug_' + name; }));
  var tpl = "// @with exclude: "+ globals.join(",") +"\n{\nlocals || {};\nfunction *gen() { SOURCE }\nreturn gen;\n}"
  var tplc = babelTemplate(tpl, { preserveComments: true });
  return tplc;
}

Compiler.prototype.wrapCallExpression = function(node) {
  return t.yieldExpression(node, true);
}

Compiler.prototype.ast_variableDeclaration = function() {
    return t.variableDeclaration('var', [
          t.variableDeclarator(t.identifier('pug_mixins'), t.logicalExpression('||', t.memberExpression(t.identifier('locals'),t.identifier('pug_mixins')) , t.objectExpression([]))),
          t.variableDeclarator(t.identifier('pug_interp'), null)
        ])
}

Compiler.prototype.ast_return = function(stringLiteral) {
  return [];
}

Compiler.prototype.ast_stringify = function(stringLiteral) {
  return stringLiteral;
}

Compiler.prototype.ast_initBufferedOp = function(node) {
  return node;
}

Compiler.prototype.ast_pushBufferedOp = function(node) {
    return t.expressionStatement(
              t.callExpression(
                t.memberExpression(t.identifier('buf'), t.identifier('push')),
                [node])
            );
}
