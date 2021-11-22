import { Data, InitResponse, Response } from './CloudObjects'

export async function init(data: Data): Promise<InitResponse> {
    return { state: {  } }
}

export async function getState(data: Data): Promise<Response> {
    return { statusCode: 200, body: data.state }
}
