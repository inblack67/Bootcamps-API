const advancedQueries = (model, populate) => async (req,res,next) => {

  const reqQuery = {...req.query};

  const removeFields = ['select', 'sort', 'page', 'limit'];    // our custom filter

  removeFields.forEach(field => delete reqQuery[field]);

  // req.query is an object so stringify needed
  let queryString = JSON.stringify(reqQuery);

  // gt = $gt
  queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  let query = model.find(JSON.parse(queryString));

  // select fields - mongoose requires space in between
  if(req.query.select)
  {
    // select(name x y z) = mongoose differentiate these args by spaces
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // sort
  if(req.query.sort)
  {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  }

  else
  {
    query = query.sort('-createdAt'); // desc date
  }

  const results = await query;

  // // pagination
  // const page = parseInt(req.query.page, 10) || 1;
  // const limit = parseInt(req.query.limit, 10) || 10;
  // const startIndex = (page - 1)*limit;
  // const endIndex = page*limit;
  // const total = await model.countDocuments();

  // query.skip(startIndex).limit(limit);

  // // populate
  // if(populate)
  // {
  //   query = query.populate(populate);
  // }

  // // main thang
  // const results = await query;

  // const pagination = {};

  // if(endIndex < total)
  // {
  //   pagination.next = {
  //     page: page + 1,
  //     limit
  //   }
  // }

  // if(startIndex > 0)
  // {
  //   pagination.prev = {
  //     page: page - 1,
  //     limit
  //   }
  // }

  res.advancedQueries = {
    success: true,
    count: results.length,
    data: results
  }

  next();

}



module.exports = advancedQueries;