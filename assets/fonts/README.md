# Pretendard

Regular(400), Medium(500), SemiBold(600), Bold(700) 정적 TTF를 앱에 포함한다.

- 버전: 1.309 (Pretendard 1.3.9)
- 원본: 기존 로컬 프로젝트에 보관된 TTF 파일을 수정 없이 복사했다. 각 파일의 패밀리·PostScript 이름·버전 메타데이터를 검증했다.
- 공식 프로젝트: https://github.com/orioncactus/pretendard
- 배포 라이선스: SIL Open Font License 1.1. 전문은 OFL.txt와 NOTICE.json에 포함한다.
- 파일 내부 저작권 고지: Copyright © 2023 Kil Hyung-jin.
- 설정 화면에서 글꼴 저작권과 라이선스 전문을 오프라인으로 확인할 수 있다.
- 런타임 등록: src/components/ui/fonts.ts. 색상·간격 토큰과 글꼴 굵기는 src/components/ui/tokens.ts에서 참조한다.
- Android/iOS에서 합성 굵기에 의존하지 않고 각 굵기에 해당하는 fontFamily를 직접 지정한다.
