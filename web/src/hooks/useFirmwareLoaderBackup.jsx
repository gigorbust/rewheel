import {useState, useEffect} from 'react'
export const useFirmwareLoaderBackup = () => {
    const [file, setFile] = useState(null)
    const [firmware, setFirmware] = useState(null)
  
    const loadFirmware = async () => {
      const reader = new FileReader()
      setFirmware(null)
  
      reader.addEventListener("load", (event) => {
        setFirmware(event.target.result)
      })
  
      reader.readAsArrayBuffer(file)
    }
  
    const clearFirmware = () => {
      setFile(null)
      setFirmware(null)
    }
  
    useEffect(() => {
      if (!file) return
      loadFirmware()
    }, [file])
  
    const checkFileExistence = async (selectedFile) => {
        try {
          const response = await fetch(selectedFile);
          if (!response.ok) {
            console.log("File does not exist");
            return false;
          }
      
          const blob = await response.blob();
          return blob;
        } catch (error) {
          console.log("Error checking file existence:", error);
          return false;
        }
      };
      
  
    const selectGTFile = async () => {
      const gtFile = "/encryptedfw6109.bin"
      const fileExists = await checkFileExistence(gtFile)
      if (fileExists) {
        console.log(fileExists)
        setFile(fileExists)
      }
    }
  
    const selectPintFile = async () => {
      const pintFile = "/encryptedfw5040.bin"
      const fileExists = await checkFileExistence(pintFile)
      if (fileExists) {
        console.log(fileExists)
        setFile(fileExists)
      }
    }
  
    return {
      file,
      firmware,
      loadFirmware,
      clearFirmware,
      fileSelected: !!file,
      selectGTFile,
      selectPintFile,
      showFirmwareInput: () => (
        <TextField
          type="file"
          accept=".bin"
          //onChange={(event) => setFile(event.target.files[0])}
        />
      ),
    }
  }