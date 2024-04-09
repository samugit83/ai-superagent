'use client'

import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { Progress } from 'antd';


export default function TrainingWindow({startUploadAndTraining}) {

    const TrainingMessage = useSelector((state) => state.app.TrainingMessage)
    const TrainingStatus = useSelector((state) => state.app.TrainingStatus)
    const UploadingProgress = useSelector((state) => state.app.UploadingProgress)

    return (
        TrainingStatus !== 'sleep' ?
        <>
        <div className="page_gpt-training-window">
            {TrainingStatus === 'files_ready' ?
            <>
                {TrainingMessage}<br></br>
                <span className='page_gpt-training-window-start'>
                    <FontAwesomeIcon style={{fontSize: '40px', color: "#06AD06", cursor: 'pointer'}} icon={faPlay} onClick={startUploadAndTraining}/>
                    &nbsp;&nbsp;Start
                </span>
            </> 
            : 
            (TrainingStatus === 'uploading' || TrainingStatus === 'training') ? 
            <>
                <Progress strokeColor={{'0%': '#108ee9','100%': '#87d068'}} percent={UploadingProgress[0]} />
                {UploadingProgress[1]}
            </>
            :
            null}
        </div>
        </>
        :
        null
     )

}
