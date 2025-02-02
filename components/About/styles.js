import styled from 'styled-components';

export const ABOUT_Wrapper = styled.div`
  margin: 0 auto;
  margin-top: 24px;
  background: #fff;
  color: gray;
  padding: 8px;
  max-width: 1200px;
   /* @media only screen and (min-width: 1200px) {
      max-width: 1180px;
    }
    @media only screen and (min-width: 992px) {
      max-width: 980px;
    }
    @media only screen and (min-width: 768px) {
      max-width: 760px;
    }
    @media only screen and (min-width: 576px) {
      max-width: 570px;
    } */
`
export const ABOUT_Title = styled.h3`
    font-size: 27px;
    margin-top: 3.2rem;
    margin-bottom: 24px;
    border-bottom: 2px solid;
    padding-bottom: 12px;
`
export const ABOUT_SecondTitle = styled.h6`
    font-weight: bold;
    margin: 8px 0 3px 0;
    padding: 24px 0 0px 0px;
    line-height: 25px;
    color: slateblue;
`
export const ABOUT_Text = styled.h6`
    font-weight: bold;
    padding: 2px 0 4px 0px;
    line-height: 21px;
    font-size: 0.92rem;
`
export const ABOUT_Sub = styled.p`
    font-size: 13px;
    /* padding: 0px 0 2px 0px; */
    line-height: 1.6;
`

export const EmptySpace = styled.div`
margin-top: 2.4rem;
margin-bottom: 2.4rem;
padding-top: 1.2rem;
padding-bottom: 1.2rem;
`
export const EmptySpaceSmall = styled.div`
margin-top: 0.4rem;
margin-bottom: 1.4rem;
padding-bottom: 1.2rem;
`
export const ContentsContainer = styled.div`
width: 100%;
display: flex;
flex-direction: column;
margin-top: 2rem;
font-weight: 600;
.logo__wrapper {
  width: 100%;
  margin: 0 auto;
  display: flex;
    justify-content: center;
}
.logo__image {
      width: 112px;
    padding: 12px;
    border-radius: 50%;
    box-shadow: 0px 1px 1px rgb(0 0 0 / 32%);
}
.main__title{
  margin-top: 1rem;
    width: 100%;
    font-size: 4.2rem;
    text-align: center;
}
.first__wrapper {
  width: 100%;
  
}
.divider__div {
  width: 100%;
   background:
radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.15) 30%, rgba(255,255,255,.3) 32%, rgba(255,255,255,0) 33%) 0 0,
radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.1) 11%, rgba(255,255,255,.3) 13%, rgba(255,255,255,0) 14%) 0 0,
radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.2) 17%, rgba(255,255,255,.43) 19%, rgba(255,255,255,0) 20%) 0 110px,
radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.2) 11%, rgba(255,255,255,.4) 13%, rgba(255,255,255,0) 14%) -130px -170px,
radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.2) 11%, rgba(255,255,255,.4) 13%, rgba(255,255,255,0) 14%) 130px 370px,
radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.1) 11%, rgba(255,255,255,.2) 13%, rgba(255,255,255,0) 14%) 0 0,
linear-gradient(45deg, #343702 0%, #184500 20%, #187546 30%, #006782 40%, #0b1284 50%, #760ea1 60%, #83096e 70%, #840b2a 80%, #b13e12 90%, #e27412 100%);
background-size: 470px 470px, 970px 970px, 410px 410px, 610px 610px, 530px 530px, 730px 730px, 100% 100%;
background-color: #5f5e5b;
    margin-top: 1.2rem;
    margin-bottom: 1.2rem;
    padding-top: 2rem;
    padding-bottom: 2rem;
    /* background-color: #2a5cb3; */
    width: 100%;
    margin-top: 4.2rem;
    margin-bottom: 4.2rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
    border-radius: 32px;
}
.contents__wrapper{
  margin-top: 12px;
    width: 100%;
    font-size: 1.5rem;
    color: gray;
    text-align: center;
    font-weight: 500;
}
.people__div{
  width: 100%;
  font-size: 1.76rem;
  color: var(--blue-button);
  text-align: center;
}
.middle__container{
      margin-top: 2.2rem;
    margin-bottom: 2.2rem;
    display: flex;
    flex-direction: column;
}
.mainimage__div{
  padding-left: 24px;
    padding-right: 24px;
    display:flex;
    justify-content: center;
    /* margin-top: 2.4rem; */
    flex-direction: column;
}
.onlytext{
  margin: 0 auto;
  margin-bottom: 2.4rem;
  margin-top: 1.4rem;
    text-align: center;
}
.mainimage__div__maintext{
  font-size: 2.4rem;
    margin-bottom: 0.8rem;
    color: gray;
    font-weight: bold;
    padding: 2px 0 4px 0px;
    line-height: 21px;
}
.sub{
  font-size:1.4rem;
  font-weight: 500;
}
.mainimage__div__mainimage{
 width: 100%;
    margin: 0 auto;
    margin-bottom: 22px;
    border-radius: 6%;
    width: 18rem;
    height: 18rem;
    filter: grayscale(1);
    object-position: 50% 50%;
    object-fit: cover;
    box-shadow: 1px 3px 3px rgb(0 0 0 / 32%);
    border: 1px solid rgba(0,0,0,0.25);
}
`