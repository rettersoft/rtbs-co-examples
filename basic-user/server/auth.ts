import CloudObjectsOperator from './CloudObjects'
import { Data, StepResponse, Response } from './CloudObjects'

const co = new CloudObjectsOperator()

// AUTHORIZERS
const anonymAllowedMethods = ['INIT', 'signin', 'signup']

export async function preAuthorizer(data: Data): Promise<Response> {
    
    console.log('preAuthorizer', data)

    if(data.method.context.identity === 'Owner') return { statusCode: 200 }

    if(anonymAllowedMethods.indexOf(data.method.name) !== -1) {
        return { statusCode: 200 }    
    }

    if(data.method.context.userId !== data.context.instanceId || data.method.context.identity !== 'enduser') {
        return {
            statusCode: 403
        }
    }

    return { statusCode: 200 }
}

// SIGNIN
export async function validateCredentials(data: Data): Promise<StepResponse> {
    
    if(data.method.request.password === data.state.private.password) {
        data.state.private = {
            ...data.state.private,
            lastLogin: Date.now()
        }
    } else {
        data.nextFlowId = 'gotoInvalidCredentials'
        data.method.response = {
            statusCode: 403,
            body: {"message": "Invalid credentials"}
        }
    }

    
    
    return data
}


// SIGNUP
export async function lookupUser(data: Data): Promise<StepResponse> {
    console.log('lookupUser')
    const { success:userFound } = await co.getLookUpKey({
        key: {
            name: 'email',
            value: data.method.request.email
        }
    })

    if(userFound) {
        data.nextFlowId = 'gotoUserAlreadyExists'
        data.method.response = {
            statusCode: 403,
            body: {"message": "User already exists."}
        }
    }
    
    
    return data
}

export async function createUser(data: Data): Promise<StepResponse> {
    console.log('createUser')
    const { email, name, password } = data.method.request
    await co.setLookUpKey({
        key: {
            name: 'email',
            value: email
        }
    })

    data.state = {
        ...data.state,
        public: { userId: data.context.instanceId },
        private: {
            email,
            name,
            password
        }
    }
    return data
}

export async function generateToken(data: Data): Promise<StepResponse> {
    console.log('generateToken')
    const actionResponse = await co.rbsAction({
        name: 'rbs.core.request.GENERATE_CUSTOM_TOKEN',
        data: { userId: data.method.context.userId, roleNames: ['enduser'] }
    })
    console.log('actionResponse', actionResponse)
    data.method.response = {
        statusCode: 200,
        body: {
            customToken: actionResponse.response.customToken
        }
    }

    return data
}
