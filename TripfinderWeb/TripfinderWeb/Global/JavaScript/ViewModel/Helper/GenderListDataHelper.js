(function()
{
  createNamespace("TF.Helper").GenderListDataHelper = GenderListDataHelper;

  function GenderListDataHelper()
  {
  }

  GenderListDataHelper.prototype.constructor = GenderListDataHelper;

  GenderListDataHelper.prototype.getGenderData = function()
  {
    return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "genders"))
      .then(res =>
      {
        return res && res.Items || [];
      });
  }

  GenderListDataHelper.prototype.getGenderDataSource = function(isName = true)
  {
    return this.getGenderData().then((dataList) =>
    {
      const output = [];
      (dataList || []).forEach((item) =>
      {
        output.push({
          Name: item.Name,
          Code: item.Code,
          text: isName ? item.Name : item.Code,
          value: item.ID,
        })
      });
      return _.sortBy(output, "text");
    });
  }

  GenderListDataHelper.prototype.getValueByKeyAndId = function(key, id)
  {
    return this.getGenderData().then((dataList) =>
    {
      const output = (dataList || []).find(item => item.ID === id);
      return output && output[key];
    });
  }

  GenderListDataHelper.prototype.getValueById = function(id)
  {
    return this.getGenderData().then((dataList) =>
    {
      return (dataList || []).find(item => item.ID === id);
    });
  }
})();