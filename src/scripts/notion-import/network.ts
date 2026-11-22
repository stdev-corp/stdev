import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net'

/*
 * Node는 IPv6와 IPv4 주소를 번갈아 시도할 때 주소마다 250ms만 기다린다. 느린
 * 네트워크에서는 IPv4 연결이 그 안에 끝나지 않아 멀쩡한 주소도 'fetch failed
 * (ETIMEDOUT)'가 난다. 이관 스크립트는 외부 주소를 많이 확인하고 내려받으므로
 * 넉넉히 기다린다. 가져오기·변환 스크립트 맨 위에서 불러온다.
 */
setDefaultAutoSelectFamilyAttemptTimeout(2000)
