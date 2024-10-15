import { useState } from 'preact/hooks'
import AddCrawlerForm from '../forms/AddCrawlerForm'
import { Popup } from '../components/Popup'

export default function AddCrawlerButton() {
    const [showForm, setShowForm] = useState(false)

    function handleSubmit(crawler: string) {
        console.log('Crawler added: ', crawler)
        setShowForm(false)
    }

    return (
        <div class="flex items-center justify-center p-4">
            <button class="btn btn-success" onClick={() => setShowForm(true)}>
                +
            </button>
            {showForm && (
                <Popup title="Add Crawler" prevError={''} onCancel={() => setShowForm(false)}>
                    <AddCrawlerForm onSubmit={(crawler) => handleSubmit(crawler)} />
                </Popup>
            )}
        </div>
    )
}
