export const protect = async (req, res, next) => {
    try {
     const userId = await req.auth();
     if(!userId){return res.status(401).json({message: "UNAUTHORIZED"})}
      return next();
    } catch(error) {
        console.error(error);
      return res.status(401).json({ message : error.message ||error.code||"UNAUTHORIZED"});
    }
}