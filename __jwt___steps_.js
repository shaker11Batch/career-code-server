/*
# simple but not at the best way
1. form client side sent information
2. generate token jwt.sign()
3. on the client side set token to the licalstorage
*/

/*
using http only cookies
1. from client side send the information (email, better: firebaser auth er token) to generate token
2. on the server side, accept user information and if needed validate it 
3. gnerate token in the server side using secret and expiresIn

_______________
set the cookies
4. while calling the api tell to use withCredentials

axios.post('http://localhost:5000/jwt', userData, {
                    withCredentials:true
  })
                
   or,
for fetch add option credentials: 'include'
                
5. in the cors setting set credentials and origin

app.use(cors({
    origin: ['http://localhost:5173/'],
    credentials: true
}))

6. after generating the token set it to the cookies with some options

 res.cookie('token', token, {
                httpOnly: true,
                secure: false
            })


            ________________________
    7.  on time:       use cookiesParser as middleware
    8.for every api you want to verify token: in the client side : if using axios withCredentials: true
    for fetch: credentials include

    ____________
    verify korbo token

*/ 