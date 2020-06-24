(function()
{
	//the graphic lib is created for graphic calculation, position/size query and graphic adjustments for DOMs
	createNamespace("TF.Graphic").RectCollisionDetector = RectCollisionDetector;

	function RectCollisionDetector()
	{
	}

	/**
	 * static function to detect whether rect got collisions, returns true if collision detected, return false if no collision detected.
	 * @param {object} rect1 first rectangle to check collision
	 * @param {object} rect2 second rectangle to check collision
	 * @returns {boolean} returns true when collision detected, return false when no collision detected
	 */
	RectCollisionDetector.withCollision = function(rect1, rect2)
	{
		return (rect1.left < rect2.left + rect2.width && rect1.left + rect1.width > rect2.left && rect1.top < rect2.top + rect2.height && rect1.height + rect1.top > rect2.top);
	};

	/**
	 * static function to detect whether 2 rect groups got collisions, returns true if any collision detected, return false if no collision detected.
	 * @param {object} rectGroup1 first rectangle array to check collision
	 * @param {object} rectGroup2 second rectangle array to check collision
	 * @returns {boolean} returns true when collision detected, return false when no collision detected
	 */
	RectCollisionDetector.withCollisionByGroup = function(rectGroup1, rectGroup2)
	{
		for (i = 0; i < rectGroup1.length; i++)
		{
			for (j = 0; j < rectGroup2.length; j++)
			{
				return (TF.Graphic.RectCollisionDetector.withCollision(rectGroup1[i], rectGroup2[j]));
			}
		}
	};

	/**
	 * static function to check if two jQuery elements collide with each other. 
	 * @param {jQuery} $el1 The first jQuery element
	 * @param {jQuery} $el2 The second jQuery element
	 * @return {boolean} true if collided, false if not.
	 */
	RectCollisionDetector.detectTwoJQueryElementsCollision = function($el1, $el2)
	{
		var rect1 = TF.Graphic.RectUtility.getElementRects($el1)[0],
			rect2 = TF.Graphic.RectUtility.getElementRects($el2)[0];

		return TF.Graphic.RectCollisionDetector.withCollision(rect1, rect2);
	};
})();