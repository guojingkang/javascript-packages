
const assert = require('assert');
const help = require('./help');

describe('basic', function () {
  it('should pass on the ok file', function () {
    const result = help.lint('basic', 'basic-ok');
    try {
      assert.equal(result.errorCount, 0);
      assert.equal(result.warningCount, 0);
    } catch (e) {
      console.log(result);
      throw e;
    }
  });

  // it('should fail on the error file', function(){
  //   const result = help.lint('basic-error')
  //   try{
  //     assert.equal(result.errorCount, 1);
  //     assert.equal(result.warningCount, 0);
  //   }catch(e){
  //     console.log(result);
  //     throw e;
  //   }
  // });
});
