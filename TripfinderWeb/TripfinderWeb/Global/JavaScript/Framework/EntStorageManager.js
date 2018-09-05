(function()
{
	createNamespace("TF").EntStorageManager = EntStorageManager;

	function EntStorageManager()
	{
		this.prefix = "ent.";
		this.storageManager = new TF.StorageManager("ent");
	};

	//EntStorageManager.prototype.save = function(token)
	//{
	//	var self = this;
	//	self.storageManager.save("token", token, true);
	//};

	//EntStorageManager.prototype.get = function()
	//{
	//	var self = this;
	//	return self.storageManager.get("token", true);
	//};

	EntStorageManager.prototype.save = function(key, value)
	{
		var self = this;
		self.storageManager.save(key, value, true);
	};

	EntStorageManager.prototype.get = function(key)
	{
		var self = this;
		return self.storageManager.get(key, true);
	};

})();
