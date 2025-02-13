import bgPhoto from '../../assets/bg.png'
import city from '../../assets/city.png'
import tmaster from '../../assets/tmaster.png'
import pins from '../../assets/pins.png'
import globe from '../../assets/globe.png'
import yelp from '../../assets/yelp.png'
import { Button } from '../../components/button'
import { useNavigate } from 'react-router-dom'

export const HomePage = () => {
  const navigate = useNavigate();

  return(
    <div className="overflow-hidden h-screen w-screen bg-cover flex flex-col items-center justify-center" style={{ backgroundImage: `url(${bgPhoto})` }}>
      <div className="flex w-full">
        <div className="w-1/2 m-10 pl-10 pt-0">
          <div className="mt-10 pl-10 ml-10 pt-4 p-6">
            <h1 className="text-6xl font-bold text-black">Discover the world </h1>
            <h1 className="text-6xl font-bold text-black">you want to see</h1>
            <h1 className="text-3xl text-black pt-10 font-medium ">MapMe, my map, made by me, for me</h1>
          </div>
          <div className="w-2/3 flex items-center justify-center ml-5 gap-8 p-6">
            <Button text="Login" onClick={() => navigate('/login')} />
            <Button text="Signup" onClick={() => {}} />
          </div>
        </div>
        <div className="w-1/2 mt-4">
          <div className="mt-4 pt-4">
            <img
              src={city}
              alt="city"
              width={500}
              height={300}
              className="object-contain"
            />
          </div>
        </div>
      </div>
      {/* logos and such */}
      <div className="flex w-3/4 justify-center gap-10 pt-12">
        {/* ticketmaster */}
        <div className="flex flex-col items-center">
          <img
            src={tmaster}
            alt="ticketmaster"
            width={44}
            height={81}
            className="object-contain"
          />
          <h1 className="w-3/4 text-center">Find local events with Ticketmaster</h1>
        </div>
        {/* yelp */}
        <div className="flex flex-col items-center">
          <img
            src={yelp}
            alt="yelp"
            width={81}
            height={81}
            className="object-contain"
          />
          <h1 className="w-3/4 text-center">Hottest restaurants with yelp</h1>
        </div>
        {/* pins */}
        <div className="flex flex-col items-center">
          <img
            src={pins}
            alt="pins"
            width={81}
            height={81}
            className="object-contain"
          />
          <h1 className=" w-3/4 text-center">Filters made by the community</h1>
        </div>
        {/* globe */}
        <div className="flex flex-col items-center">
          <img
            src={globe}
            alt="globe"
            width={81}
            height={81}
            className="object-contain"
          />
          <h1 className="w-3/4 text-center">CesiumJS powered Application</h1>
        </div>
      </div>
    </div>
  )
}