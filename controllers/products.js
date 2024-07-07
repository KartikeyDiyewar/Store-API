const Product = require("../models/product");

const getAllProductsStatic = async (req, res) => {
  const products = await Product.find({});
  await res.status(200).json({ products });
};

const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, field, numericFilters } = req.query;
  const queryObject = {};
  if (featured) {
    queryObject.featured = featured === "true" ? true : false;
  }
  if (company) {
    queryObject.company = company;
  }
  if (name) {
    queryObject.name = { $regex: name, $options: "i" };
  }
  //console.log(queryObject);
  let result = Product.find(queryObject);
  if (sort) {
    const sortedList = sort.split(",").join(" ");
    result = result.sort(sortedList);
  } else {
    result = result.sort("createdAt");
  }

  if (field) {
    const fieldList = field.split(",").join(" ");
    result = result.select(fieldList);
  }

  const limit = req.query.limit || 10;
  const page = req.query.page || 1;
  const skip = (page - 1) * limit;

  result = result.limit(limit).skip(skip);

  if (numericFilters) {
    operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    //regEx found on stack overflow which search ing for convertion from userfriendly comparators to mongoose comparators
    const regEx = /\b(<|<=|=|>|>=)\b/g;
    //in following replacing the filters string for moongose operators from user friendly operators
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );
    //console.log(filters);
    //option to check for which field numeric filters can be applied
    const options = ["price", "rating"];
    //splitting the filters string to array of strings at , and then splitting each elemrnt of the filters array at - and
    //naming them, then adding each of those fields to query object
    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-");
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) };
      }
    });
    //console.log(filters);
  }

  //console.log(queryObject);

  const products = await result;

  await res.status(200).json({ products, nbHits: products.length });
};

module.exports = { getAllProducts, getAllProductsStatic };
