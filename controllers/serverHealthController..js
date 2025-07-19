
const saveServer = (req,res) => {
    try{
        return res.status(200).json({message : "server is running"});

    }catch(error){
        return res.status(400).json({message : "something went wrong" , error})
    }
}


module.exports = {
  saveServer,
};
